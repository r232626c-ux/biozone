import React, { useState, useMemo} from "react";
import dayjs from "dayjs";
import {
  Paper, Typography, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Box, Button,
  Select, MenuItem, Stack
} from "@mui/material";

import axios from "axios";
import { API_URL } from "../../utils/api";

function getReferenceRange(reference, age, sex) {
  if (!reference) return null;
  const sexKey = sex?.toLowerCase() === "male" ? "male" : sex?.toLowerCase() === "female" ? "female" : null;

  // Prioritize sex-specific, fallback to adult/all
  let ranges = sexKey && reference[sexKey] ? reference[sexKey] : reference["adult"] || reference["all"];
  if (!ranges) {
    // Special case for RBS-style references with fasting/random/diabetic_target keys
    const specialKeys = ["random", "fasting", "diabetic_target"];
    for (const key of specialKeys) {
      if (Array.isArray(reference[key]) && reference[key].length >= 2) {
        return { reference_min: reference[key][0], reference_max: reference[key][1] };
      }
    }
    return null;
  }

  if (!Array.isArray(ranges)) {
    // ranges is an object with age brackets
    for (const key of Object.keys(ranges)) {
      if (key === "all") return { reference_min: ranges[key][0], reference_max: ranges[key][1] };
      if (key.includes("+") && age >= parseInt(key)) return { reference_min: ranges[key][0], reference_max: ranges[key][1] };
      if (key.includes("-")) {
        const [min, max] = key.split("-").map(Number);
        if (age >= min && age <= max) return { reference_min: ranges[key][0], reference_max: ranges[key][1] };
      }
      if (key.startsWith("<") && age < parseInt(key.substring(1))) return { reference_min: ranges[key][0], reference_max: ranges[key][1] };
    }
    return null; // no match
  }

  // ranges is an array
  return { reference_min: ranges[0], reference_max: ranges[1] };
}

function getMicrobiologySubTabs(testName) {
  const microTests = ["Urine Microscopy", "Fluid M/C/S", "Rectal Swab M/C/S", "Stool M/C/S", "Swab M/C/S", "Sputum M/C/S"];
  if (microTests.includes(testName)) {
    return ["microscopy", "culture", "drugs"];
  }
  return [];
}

function evaluateResult(value, range) {
  if (!range) return ""; // default to empty if range missing
  const { reference_min, reference_max } = range;
  if (reference_min !== null && value < reference_min) return "L";
  if (reference_max !== null && value > reference_max) return "H";
  return ""; // blank for normal
}

function calculateLDL(totalChol, hdl, triglycerides) {
  if (!totalChol || !hdl || !triglycerides) return null;
  return totalChol - hdl - triglycerides / 5;
}

// TSAT = (Iron / TIBC) * 100
function calculateTSAT(iron, tibc) {
  if (!iron || !tibc) return null;
  return (iron / tibc) * 100;
}

function calculateEGFR(scr, age, sex) {
  if (!scr || !age || !sex) return null;

  // Convert from mmol/L to mg/dL if needed (assume input is mmol/L)
  // 1 mmol/L = 0.0113 mg/dL, so 1 mg/dL ≈ 88.4 mmol/L
  // If value is > 10, assume it's already in mmol/L and convert
  const scrMgDl = scr > 10 ? scr / 88.4 : scr;

  let kappa = sex?.toLowerCase() === "female" ? 0.7 : 0.9;
  let alpha = sex?.toLowerCase() === "female" ? -0.241 : -0.302;

  const ratio = scrMgDl / kappa;

  const egfr =
    142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.2) *
    Math.pow(0.9938, age) *
    (sex?.toLowerCase() === "female" ? 1.012 : 1);

  return Math.round(egfr);
}

// Cockcroft–Gault (expects creatinine in mmol/L, converts to mg/dL for formula)
function calculateCrCl(age, weight, scr, sex) {
  if (!age || !weight || !scr) return null;
  
  // Convert from mmol/L to mg/dL if needed
  const scrMgDl = scr > 10 ? scr / 88.4 : scr;
  
  const factor = sex?.toLowerCase() === "female" ? 0.85 : 1;
  return Math.round(((140 - age) * weight * factor) / (72 * scrMgDl));
}

function calculateAnionGap(na, cl, hco3) {
  if (!na || !cl || !hco3) return null;
  return na - (cl + hco3);
}

// UNIFIED INTERPRETATION PIPELINE
function interpretLabTest({ testName, value, age, sex, referenceInfo }) {
  const isNumeric = !isNaN(parseFloat(value));

  if (isNumeric) {
    const numValue = parseFloat(value);

    // Get range from lab_reference
    const range = getReferenceRange(referenceInfo?.reference, age, sex);
    const flag = evaluateResult(numValue, range);

    return {
      type: "quantitative",
      value: numValue,
      refMin: range?.reference_min,
      refMax: range?.reference_max,
      comment: referenceInfo?.comment || "",
      flag,
      unit: referenceInfo?.unit || "",
    };
  }

  // Qualitative
  return {
    type: "qualitative",
    value: value,
    refMin: null,
    refMax: null,
    comment: referenceInfo?.comment || "",
    flag: "",
    unit: "",     // blank for qualitative
  };
}

const ANTIBIOTIC_DRUGS = [
 "Amikacin", "Amoxicillin", "Ampicillin", "Augmentin", "Azithromycin",
      "Carbenicillin", "Cefotaxime", "Cefoxitin", "Ceftazidime", "Ceftriaxone",
      "Cefuroxime", "Cephalophin", "Cephradine", "Chloramphenicol", "Ciprofloxacin",
      "Clindamycin", "Cloxacillin", "Colistin Sulphate", "Co-trimoxazole", "Doxycycline",
      "Ertapenem", "Erythromycin", "Fusidic Acid", "Gentamycin", "Kanamycin",
      "Levofloxacin", "Linezolid", "Meropenem", "Metronidazole", "Nalidixic Acid",
      "Nitrofurantoin", "Nitroxolin", "Norfloxacin", "Oxacillin", "Oxycycline",
      "Penicillin", "Piperacillin", "Polymyxin B Sulfate", "Streptomycin",
      "Tetracycline", "Tobramycin"
];

// lab_test_reference_data.js
const lab_reference = {
  "Tumor Markers": {
    "PSA": {
      unit: "ng/mL",
      reference: { male: { "<50": [0, 2.5], "50-59": [0, 3.5], "60-69": [0, 4.5], "70+": [0, 6.5] } },
      //comment:
        //"HIGH: suggests prostate disease (BPH, prostatitis) or prostate cancer; HIGHER risk with values > age-specific upper limit. LOW: within expected. Trend/velocity matters. POSITIVE/NEGATIVE not applicable.",
      calculation: "Immunoassay (total PSA). Use age-specific cutoffs; consider free/total ratio for better specificity."
    },
    "CA-125": {
      unit: "U/mL",
      reference: { female: { all: [0, 35] } },
      //comment: "HIGH: ovarian malignancy suspicion, but can be high with menstruation, endometriosis, inflammation. LOW: normal. Best for trend monitoring post-diagnosis.",
      calculation: "Immunoassay/ELISA"
    },
    "CEA": {
      unit: "ng/mL",
      reference: { adult: [0, 3] },
      //comment: "HIGH: colorectal and other adenocarcinomas; smoking elevates baseline. LOW: normal. Monitor trends for recurrence.",
      calculation: "Immunoassay"
    },
    "AFP": {
      unit: "ng/mL",
      reference: { adult: [0, 10] },
      //comment: "HIGH: hepatocellular carcinoma, germ cell tumors; LOW: normal. Use with imaging and other markers.",
      calculation: "Immunoassay"
    },
    "CA 19-9": {
      unit: "U/mL",
      reference: { adult: [0, 37] },
      //comment: "HIGH: pancreatic/biliary malignancy; benign biliary obstruction can raise it. LOW: normal.",
      calculation: "Immunoassay"
    },
    "CA 15-3": {
      unit: "U/mL",
      reference: { adult: [0, 31.3] },
      // comment: "HIGH: used to monitor breast cancer burden/recurrence; not for screening. LOW: normal.",
      calculation: "Immunoassay"
    },
    "CA 72-4": {
      unit: "U/mL",
      reference: { adult: [0, 6.9] },
      //comment: "HIGH: GI/gastric tumors associated; adjunct marker.",
      calculation: "Immunoassay"
    },
    "Thyroglobulin": {
      unit: "ng/mL",
      reference: { adult: [0, 55] },
      comment: "HIGH after thyroidectomy may indicate residual/recurrent thyroid cancer; interpret with anti-thyroglobulin antibodies.",
      calculation: "Immunoassay"
    },
    "Calcitonin": {
      unit: "pg/mL",
      reference: { adult: [0, 10] },
      //comment: "HIGH: medullary thyroid carcinoma suspicion; very high values more specific.",
      calculation: "Immunoassay"
    },
    "Beta-2 Microglobulin": {
      unit: "mg/L",
      reference: { adult: [0.8, 2.2] },
      //comment: "HIGH: renal dysfunction, hematologic malignancies; LOW: typical.",
      calculation: "Immunoassay"
    },
    "NSE": {
      unit: "ng/mL",
      reference: { adult: [0, 12] },
      //comment: "HIGH: neuroendocrine tumors, small cell lung cancer; LOW: typical.",
      calculation: "Immunoassay"
    },
    "CYFRA 21-1": {
      unit: "ng/mL",
      reference: { adult: [0, 3.3] },
      //comment: "HIGH: NSCLC (esp. squamous cell); LOW: typical.",
      calculation: "Immunoassay"
    },
    "LDH": {
      unit: "U/L",
      reference: { adult: [140, 280] },
     // comment: "HIGH: nonspecific marker of tissue damage, hemolysis, tumor burden; LOW: rare clinically.",
      calculation: "Enzymatic assay"
    },
    "HE4": {
      unit: "pmol/L",
      reference: { female: { all: [0, 70] } },
      //comment: "HIGH: ovarian cancer marker (used with CA-125 & algorithms like ROMA).",
      calculation: "Immunoassay"
    }
  },

  "Serology": {
    "HIV test": {
      unit: "Reactive/Non-reactive (Positive/Negative)",
      reference: { all: ["Non-reactive"] },
      //comment:
        //"REACTIVE: likely HIV infection — confirm with differentiation assay or NAAT per algorithm. NON-REACTIVE: no detection; consider window period if recent exposure.",
      calculation: "4th-generation Ag/Ab immunoassay screening; confirm by differentiation assay/PCR"
    },
    "BhCG": {
      unit: "mIU/mL",
      reference: { female: { "non-pregnant": [0, 5], "pregnant": "gestation dependent (rises rapidly early)" } },
      comment: "ELEVATED: pregnancy or trophoblastic disease; LOW/NEGATIVE: no pregnancy or below detection limit. In men, high can indicate germ cell tumors.",
      calculation: "Quantitative immunoassay"
    },
    "Widal": {
      unit: "Titer",
      reference: { all: ["lab/region dependent; often <1:80 considered not significant"] },
      //comment: "HIGH titers may suggest typhoid/paratyphoid but interpretation limited by background/previous infection or vaccination.",
      calculation: "Agglutination"
    },
    "HbsAg": {
      unit: "Reactive/Non-reactive",
      reference: { all: ["Non-reactive"] },
      calculation: "Immunoassay"
    },
    "HSV": {
      unit: "IgG/IgM or PCR",
      reference: { all: ["IgG negative if no prior exposure; IgM negative if no acute infection"] },
      //comment: "IgM positive may suggest recent infection (false positives possible). IgG positive indicates prior exposure. PCR of lesion best for acute disease.",
      calculation: "Serology or PCR"
    },
    "Syphilis": {
      unit: "Reactive/Non-reactive (RPR/VDRL + confirmatory treponemal)",
      reference: { all: ["Non-reactive"] },
      // comment: "REACTIVE: likely syphilis — confirm with treponemal test; titer helps stage/monitor therapy. NON-REACTIVE: no serologic evidence, but early window possible.",
      calculation: "Non-treponemal + treponemal algorithms"
    },
    "Bilharzia Serology": {
      unit: "Reactive/Non-reactive",
      reference: { all: ["Non-reactive"] },
      calculation: "Serological antibody assay"
    },
    "H.pylori": {
      unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      //comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
    },
    "CRP": {
      unit: "mg/L",
      reference: { adult: [0, 7] },
      //comment: "HIGH: acute inflammation/infection. CRP 10–40 mg/L often viral/mild inflammation; >40 mg/L suggests bacterial/severe inflammation.",
      calculation: "Immunoturbidimetry"
    },
    "RF": {
      unit: "IU/mL",
      reference: { adult: [0, 14] },
      // comment: "HIGH: associated with rheumatoid arthritis and other autoimmune conditions. LOW: typical.",
      calculation: "ELISA or nephelometry"
    },
    "ANA": {
      unit: "Titer (e.g., 1:80)",
      reference: { all: ["Negative or <1:80 (lab dependent)"] },
        //comment: "POSITIVE: suggests autoimmune process (SLE, etc.) — pattern/titer and clinical context determine significance; low titers can be nonspecific.",
      calculation: "Indirect immunofluorescence or ELISA"
    },
    "Allergy tests (IgE/skin)": {
      unit: "kU/L (IgE) / wheal mm (skin)",
      reference: { all: ["Depends on specific allergen and lab bins"] },
      //comment: "POSITIVE/sensitization indicates immune response; clinical allergy requires correlation with history and sometimes challenge tests.",
      calculation: "Specific IgE immunoassay or skin prick measurement"
    },
    "Urine Drug Test": {
      unit: "Positive/Negative and concentration µg/mL",
      reference: { all: ["Negative below assay cutoffs; Positive if above cutoff"] },
      //comment: "POSITIVE: recent exposure (window varies by drug and matrix); confirm positives with GC-MS/LC-MS/MS for legal/clinical decisions.",
      calculation: "Immunoassay screen; confirm by mass spectrometry"
    },
    "TORCH": {
      unit: "IgM/IgG Reactive/Non-reactive",
      reference: { all: ["Non-reactive IgM (no acute infection); IgG depends on immunity/exposure"] },
      // comment: "IgM POSITIVE suggests recent/acute infection (careful of false positives); IgG POSITIVE indicates past exposure or immunity.",
      calculation: "Serology panels (ELISA)"
    },
    "Measles/ Rubella/ Varicella / Dengue / Zika / Yellow Fever": {
      unit: "IgG/IgM Reactive/Non-reactive",
      reference: { all: ["Non-reactive IgM in naive; IgG varies"] },
      //  comment: "IgM indicates recent infection; IgG indicates prior exposure or immunity. Use PCR in acute PCR-window for high sensitivity.",
      calculation: "ELISA or PCR when appropriate"
    }
  },

  "Full Blood Count (FBC)": {
  "WBC": {
    unit: "10^9/L",
    reference: { adult: [4, 10] },
    calculation: "Automated hematology analyzer"
  },
  "RBC": {
    unit: "10^12/L",
    reference: { adult: [3.8, 5.5] },
    calculation: "CBC analyzer"
  },
   "HB": {
    unit: "g/dL",
    reference: { adult: [12, 18] },
    calculation: "CBC analyzer"
  },
  "HCT": {
    unit: "%",
    reference: { adult: [35, 49] },
    calculation: "Calculated from RBC and MCV"
  },
   "MCV": {
    unit: "fL",
    reference: { adult: [79, 100] },
    calculation: "MCV = Hct (%) * 10 / RBC (10^12/L)"
  },
  "MCH": {
    unit: "pg",
    reference: { adult: [27, 35] },
    calculation: "MCH = Hgb (g/dL) * 10 / RBC (10^12/L)"
  },
  "MCHC": {
    unit: "g/dL",
    reference: { adult: [29, 37] },
    calculation: "MCHC = Hgb (g/dL) / Hct (%) * 100"
  },
  "RDW": {
    unit: "%",
    reference: { adult: [11, 16] },
    calculation: "Analyzer-calculated"
  },
  "Platelets": {
    unit: "x10^3 /µL",
    reference: { adult: [150, 450] },
    calculation: "CBC analyzer"
  },
  "Neutrophils (%)": {
    unit: " %",
    reference: { adult: [40, 75]  },
    calculation: "CBC differential"
  },
  "Lymphocytes (%)": {
    unit: "%",
    reference: { adult: [25, 40] },
    calculation: "CBC differential"
  },
  "Monocytes (%)": {
    unit: "%",
    reference: { adult: [2, 10]  },
    calculation: "CBC differential"
  },
  "Neutrophils": {
    unit: "10^9/L ",
    reference: { adult: [1.5, 7.5]  },
    calculation: "CBC differential"
  },
  "Lymphocytes": {
    unit: "10^9/L ",
    reference: { adult: [1, 4]  },
    calculation: "CBC differential"
  },
  "Monocytes": {
    unit: "10^9/L ",
    reference: { adult:  [0.2, 1]  },
    calculation: "CBC differential"
  },
 
},

   "Hematology": {
    "PDW": {
      unit: "%",
      reference: { adult: ["lab dependent; qualitative"] },
      //comment: "Platelet distribution width — high suggests variability in platelet size.",
      calculation: "Analyzer"
    },
     "Blood Group": {
      unit: " ",
      reference: { male: [], female: [] },
      //comment: "Elevated: nonspecific inflammation. Trends useful.",
      calculation: "Westergren method"
    },
    "Reticulocyte Count": {
      unit: "%",
      reference: { adult: [0.5, 2.5] },
      //comment: "HIGH: marrow response to anemia/hemolysis. LOW: inadequate marrow response.",
      calculation: "Automated or manual supravital staining"
    },
    "Peripheral Blood Smear": {
      unit: "Morphology",
      reference: { all: ["Normal morphology"] },
      //comment: "Qualitative morphology — abnormal shapes (schistocytes, blasts, hypersegmented neutrophils) guide diagnosis.",
      calculation: "Microscopy"
    },
    "ESR": {
      unit: "mm/hr",
      reference: { male: [0, 15], female: [0, 20] },
      //comment: "Elevated: nonspecific inflammation. Trends useful.",
      calculation: "Westergren method"
    },
    "INR": {
      unit: "ratio",
      reference: { adult: [0.96, 1.2] },
      //comment: "HIGH: anticoagulation effect or clotting factor deficiency; monitor warfarin therapy.",
      calculation: "Derived from PT"
    },
    "D-Dimer": {
      unit: "mg/L",
      reference: { adult: [0, 0.5] },
      //comment: "HIGH: possible clot breakdown (DVT/PE) but nonspecific (inflammation, malignancy). Normal helps rule-out PE in low-risk patients.",
      calculation: "Immunoassay"
    }
  },




"Cytology": {
  
  LBC: {
   
    comment: "Clinical Data: PVD",
 clinicai_data: "",
    nature_of_specimen: "",
    specimen_adequacy: "",
    epithelial_abnormalities: "",
    diagnosis: "",
    recommendation: "",     
"Comment": "",
    calculation: "Diazo method or enzymatic"
  },
  PeripheralBloodSmear: {
    //unit: "g/dL",
   // reference: { adult: [0.3, 4] },
   // calculation: "Diazo method or enzymatic"
  },
  PapSmear: {
   // unit: "g/dL",
   // reference: { adult: [0.1, 25] },
   // calculation: "Bromocresol green or purple"
  },
  
 
},


  

  "Urea & Electrolytes": {
  
   "Sodium": {
    unit: "mmol/L",
    reference: { adult: [135, 147] },
    //comment: "GFR Interpretation: GFR may be affected by pregnancy, obesity, extreme ages, and acute reduction of muscle mass. Stages of chronic kidney disease according to GFR (mL/min/1.73 m²): Stage 1 (Normal) >89; Stage 2 (Mild decrease) 60–89; Stage 3 (Moderate decrease) 30–59; Stage 4 (Severe decrease) 15–29; Stage 5 (End-stage renal disease) <15.",
    calculation: "Ion-selective electrode"
  },
  "Potassium": {
    unit: "mmol/L",
    reference: { adult: [3.5, 5.3] },
    calculation: "Ion-selective electrode"
  },
  "Chloride": {
    unit: "mmol/L",
    reference: { adult: [96, 110] },
    calculation: "Urease method"
  },
   "Bicarbonate": {
    unit: "mmol/L",
    reference: { adult: [18, 31] },
    calculation: "Chemistry analyzer or blood gas"
  },
  "Urea": {
    unit: "mmol/L",
    reference: { adult: [2.5, 6.5] },
    calculation: "Urease method"
  },
  "Creatinine": {
    unit: "mmol/L",
    reference: { adult: [58, 110] },
    //comment: "Marker of kidney function; elevated suggests renal impairment. Used to calculate eGFR.",
    calculation: "Jaffe or enzymatic assays"
  },
  "Anion Gap (corrected)": {
      unit: "mmol/L",
      reference: { adult: [8, 12] },
      //comment: "AG = Na - (Cl + HCO3). Corrected AG accounts for low albumin.",
      calculation: "AG = Na - (Cl + HCO3)"
    },
  "eGFR (CKD-EPI)": {
      unit: "mL/min/1.73m2",
      reference: { adult: [80, 1000000000] },
      //comment: "Estimated glomerular filtration rate using CKD-EPI equation. Stages: >90 (normal), 60-89 (mild), 30-59 (moderate), 15-29 (severe), <15 (kidney failure).",
      calculation: "CKD-EPI equation: 142 * min(Cr/κ,1)^α * max(Cr/κ,1)^-1.2 * 0.9938^age * 1.012 (female)"
    }
},

  "LFT (Liver Function Test)": {
 
  "ALT": {
    unit: "U/L",
    reference: { adult: [7, 56] },
    calculation: "Enzymatic assay"
  },
  "AST": {
    unit: "U/L",
    reference: { adult: [11, 38] },
    calculation: "Enzymatic assay"
  },
  "ALP": {
    unit: "U/L",
    reference: { adult: [53, 128] },
    calculation: "Enzymatic assay"
  },
  "GGT": {
    unit: "µmol/L",
    reference: { adult: [8, 61] },
    calculation: "Enzymatic assay"
  },
  "Direct Bilirubin": {
    unit: "µmol/L",
    reference: { adult: [1.7, 5.1] },
    calculation: "Diazo method or enzymatic"
  },
  "Total Bilirubin": {
    unit: "g/L",
    reference: { adult: [3, 29] },
    calculation: "Diazo method or enzymatic"
  },
  "Albumin": {
    unit: "g/L",
    reference: { adult: [35, 50] },
    calculation: "Bromocresol green or purple"
  },
  "Total Protein": {
    unit: "g/L",
    reference: { adult: [64, 81] },
    calculation: "Biuret"
  },
  "Globulin": {
    unit: "g/L",
    reference: { adult: [25, 30] },
    calculation: "Calculated (Total Protein − Albumin)"
  }
},


"Fluid Biochemistry": {
  
  "Glucose": {
    unit: "mmol/L",
    reference: { adult: [2.8, 4.4] },
    calculation: "Diazo method or enzymatic"
  },
  "Total Protein": {
    unit: "g/dL",
    reference: { adult: [0.3, 4] },
    calculation: "Diazo method or enzymatic"
  },
  "Fluid Albumin": {
    unit: "g/dL",
    reference: { adult: [0.1, 25] },
    calculation: "Bromocresol green or purple"
  },
  "Chloride": {
    unit: "mmol/L",
    reference: { adult: [96, 106] },
    calculation: "Biuret"
  },
  "LDH": {
    unit: "U/L",
    reference: { adult: [50, 200] },
    //comment: "LDH in cerebrospinal fluid; elevated suggests infection or bleeding.",
    calculation: "Enzymatic assay"
  }
},

"Serum Iron Studies": {
  
  "Iron": {
    unit: "umol/L",
    reference: { adult: [9, 30.4] },
    //comment: "LOW: iron deficiency; HIGH: iron overload.",
    calculation: "Colorimetric assay"
  },
  "Transferrin": {
    unit: "g/L",
    reference: { adult: [2, 3.6] },
    //comment: "Iron transport protein; HIGH in iron deficiency.",
    calculation: "Immunoassay"
  },
  "% Iron saturation": {
    unit: "%",
    reference: { adult: [20, 50] },
    //comment: "TSAT = (Iron/TIBC)*100; LOW: iron deficiency; HIGH: overload.",
    calculation: "Calculated from Iron and TIBC"
  },
  "Ferritin": {
    unit: "ng/mL",
    reference: { male: [30, 400], female: [15, 150] },
    //comment: "Stores iron; LOW: deficiency; HIGH: inflammation/overload.",
    calculation: "Immunoassay"
  },
  "TIBC": {
    unit: "umol/L",
    reference: { adult: [45, 72] },
    //comment: "Total iron-binding capacity; HIGH in deficiency.",
    calculation: "Colorimetric assay"
  },
  "Soluble transferrin receptor": {
    unit: "nmol/L",
    reference: { adult: [8.7, 28] },
      //comment: "Indicates iron deficiency at tissue level.",
    calculation: "Immunoassay"
  }
},

"CAMP": {
  
  "Calcium": {
    unit: "mmol/L",
    reference: { adult: [2.1, 2.55] },
  
    calculation: "Colorimetric or ISE"
  },
  "Albumin": {
    unit: "g/L",
    reference: { adult: [35, 50] },
    
    calculation: "Bromocresol green"
  },
  "Magnesium": {
    unit: "mmol/L",
    reference: { adult: [0.74, 1.5] },
    
    calculation: "ISE or colorimetric"
  },
  "Phosphate": {
    unit: "mmol/L",
    reference: { adult: [0.74, 1.52] },
    
    calculation: "Colorimetric assay"
  },
  "Corrected Calcium": {
    unit: "mmol/L",
    reference: { adult: [2.1, 2.6] },
    
    calculation: "Calculated from total calcium and albumin"
  },
 
},



"Liquid Based Cytology": {
  "LBC": {
    unit: "",
    comment: "Clinical Data: PVD",

    "Nature of Specimen": "Liquid based cytology",
    "Specimen Adequacy": "Adequate for evaluation",
    "Epithelial Abnormalities": "HSIL",
    "Diagnosis": "Cervical LBC - HSIL",
    "Recommendation": "Colposcopy and biopsy recommended",

    calculation: "Diazo method or enzymatic"
  }
},


"Cardiac Enzymes": {
 
  "Myoglobin": {
    unit: "ng/ml",
    reference: { adult: [0, 91] },
    calculation: "Diazo method or enzymatic"
  },
  "CK-MB": {
    unit: "ng/ml",
    reference: { adult: [0, 5] },
    calculation: "Diazo method or enzymatic"
  },
  "CK": {
    unit: "U/L",
    reference: { adult: [26, 195] },
    calculation: "Bromocresol green or purple"
  },
  "AST": {
    unit: "U/L",
    reference: { adult: [7, 37] },
    calculation: "Biuret"
  },
  "LDH": {
    unit: "U/L",
    reference: { adult: [91, 340] },
    calculation: "Biuret"
  },
  "Cardiac Troponin I": {
    unit: "ng/ml",
    reference: { adult: [0, 0.3] }
  
  }
},





  "Lipid Profile": {
  
  "Total Cholesterol": {
    unit: "mmol/L",
    reference: { adult: [3.6, 5.2] },
    calculation: "Enzymatic method"
  },
  "Triglycerides": {
    unit: "mmol/L",
    reference: { adult: [0.4, 2] },
    calculation: "Enzymatic assay"
  },
  "HDL Cholesterol": {
    unit: "mmol/L",
    reference: { adult: [1, 2] },
    calculation: "Direct enzymatic assay"
  },
  "LDL Cholesterol": {
    unit: "mmol/L",
    reference: { adult: [0, 3.1] },
    calculation: "Direct assay or Friedewald: LDL = TC − HDL − (TG/5) (valid if TG <400 mg/dL)"
  },
  "VLDL Cholesterol": {
    unit: "mmol/L",
    reference: { adult: [0, 0.6] },
    calculation: "VLDL ≈ TG/5 (approximation)"
  },
  "NON-HDL Cholesterol": {
    unit: "mmol/L",
    reference: { adult: ["<3.8"] },
    calculation: "NON-HDL Cholesterol = Total Cholesterol − HDL Cholesterol"
  },
  "Total Chol/HDL Ratio": {
    unit: "",
    reference: { adult: ["<4.1"] },
    calculation: "Total Cholesterol / HDL Cholesterol"
  }
},
  
"Insulin Test": {
  
  "Serum Insulin": {
    unit: "uIU/ml",
    reference: { adult: [1.96, 23.76] },
    calculation: "Enzymatic method"
  }
 
},

"RPR, TPHA": {
 
  "RPR": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "TPHA": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  }
 
},

"H.pylori": {
  
  "IgG": {

    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
  
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "IgM": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      calculation: "Stool antigen, urea breath test, or serology"
  }
 
},


"Glycosylated Hb (HbA1C)": {
  
  "Glycosylated Hb (%)": {
    unit: "%",
    reference: { adult: [4.6, 6.5] },
    //comment: "HbA1c (DCCT %): 4.0–5.6% = Normal; 5.7–6.4% = Increased risk of diabetes (Prediabetes); ≥6.5% = Diabetes mellitus. Reference ranges: Non-diabetes mellitus 4.8–6.0%; Diabetes mellitus (desirable target) <7.0%. Note: Anaemias and haemoglobinopathies may yield discrepant HbA1c results.",
    calculation: "Enzymatic method"
   

  },
  "Estimated average glucose": {
    unit: "nmol/L",
    reference: { adult: [3.2, 7.4] },
    calculation: "Enzymatic method"
  },
  "Non-diabities mellitus": {
    unit: "%",
    reference: { adult: [4.8, 6] },
    calculation: "Enzymatic method"
  },
  "Diabetes mellitus": {
    unit: "",
    reference: { adult: [] },
    calculation: "Enzymatic method"
  }
 
},
  
"Torch Screen": {
  
  "Toxoplasma (IgM)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      //comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Toxoplasma (IgG)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Rubella (IgM)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Rubella (IgG)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      //comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "CMV (IgM)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
     
      calculation: "Stool antigen, urea breath test, or serology"
  },
 "CMV (IgG)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 1 (IgM)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 1 (IgG)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      //comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 2 (IgM)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 2 (IgG)": {
    //unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      
      calculation: "Stool antigen, urea breath test, or serology"
  }
},

"CRP, HS CRP": {
  
  "CRP": {
    unit: "mg/L",
    reference: { adult: [0.5, 10] },
    calculation: "Enzymatic method"
  },
  "HS CRP": {
    unit: "mg/L",
    reference: { adult: [0, 7] },
    calculation: "Enzymatic method"
  }
 
},

"CD4 Count": {
  
  "CD4": {
    unit: "cell/uL",
    reference: { adult: [410, 1590] },
    calculation: "Enzymatic method"
  },
  "CD4%": {
    unit: "%",
    reference: { adult: [31, 66] },
    calculation: "Enzymatic method"
  }
 
},

"Clotting Profile": {
 
  "Patient Prothrombin Time": {
    unit: "sec",
    reference: { adult: [11, 14] },
    //comment: "PT measures extrinsic/common coagulation pathway.",
    calculation: "Optical end-point detection"
  },
  "Control Prothrombin Time": {
    unit: "sec",
    reference: { adult: [11, 14] },
    //comment: "Control reference for PT.",
    calculation: "Optical end-point detection"
  },
  "INR": {
    //unit: "ratio",
    reference: { adult: [0.96, 1.2] },
    //comment: "Monitor for warfarin therapy; HIGH indicates anticoagulation.",
    calculation: "Derived from PT"
  },
  "APTT Patient": {
    unit: "sec",
    reference: { adult: [24, 45] },
    calculation: "Enzymatic method"
  },
  "APTT:Control": {
    unit: "sec",
    reference: { adult: [] },
    calculation: "Enzymatic method"
  }
 
},


"Female hormones": {
  
  "Estradiol": {
    unit: "pg/ml",
    reference: { female: [30, 400] },
    //comment: "Varies with menstrual cycle; LOW in menopause.",
    calculation: "Immunoassay"
  },
  "Progesterone": {
    unit: "ng/ml",
    reference: { female: [0.1, 0.8] },
    //comment: "Varies with menstrual cycle; HIGH in pregnancy.",
    calculation: "Immunoassay"
  },
  "FSH": {
    unit: "mIU/mL",
    reference: { female: { "follicular": [3.5, 12.5], "ovulation": [8, 50], "luteal": [1, 10], "postmenopausal": [25, 100] }, male: [1.5, 12] },
    //comment: "Gonadotropin; HIGH in ovarian failure or postmenopause.",
    calculation: "Immunoassay"
  },
  "LH": {
    unit: "mIU/mL",
    reference: { female: { "follicular": [1.5, 10], "ovulation": [12, 100], "luteal": [0.5, 16], "postmenopausal": [10, 100] }, male: [1, 8] },
    // comment: "Gonadotropin; surge triggers ovulation.",
    calculation: "Immunoassay"
  },
  "Prolactin": {
    unit: "ng/mL",
    reference: { female: [2.6, 29], male: [2, 18] },
    //comment: "HIGH: prolactinoma or hypothyroidism; LOW: rare.",
    calculation: "Immunoassay"
  },
  "Testosterone": {
    unit: "ng/ml",
    reference: { adult: [1, 10.5] },
    calculation: "Enzymatic method"
  }
 
},

"Progesterone": {
 
  "Progesterone": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      //comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Follicular Phase": {
    unit: "nmol/L",
    reference: { female: [0.3, 2.2] },
    //comment: "Early follicular phase progesterone levels.",
    calculation: "Immunoassay"
  },
  "Luteal Phase": {
    unit: "nmol/L",
    reference: { female: [6, 30] },
    //  comment: "High progesterone in luteal phase supports normal ovulation.",
    calculation: "Immunoassay"
  },
  "Post Menopausal Female": {
    unit: "nmol/L",
    reference: { female: [0.1, 0.3] },
    //comment: "Low progesterone in postmenopause due to cessation of ovulation.",
    calculation: "Immunoassay"
  },
  "Preg 1st Trimester": {
    unit: "nmol/L",
    reference: { female: [10, 50] },
    //  comment: "Rising progesterone in first trimester supports early pregnancy.",
    calculation: "Immunoassay"
  },
  "Preg 2nd Trimester": {
    unit: "nmol/L",
    reference: { female: [30, 120] },
    //comment: "Higher progesterone in second trimester.",
    calculation: "Immunoassay"
  },
  "Preg 3rd Trimister": {
    unit: "nmol/L",
    reference: { female: [60, 300] },
    //comment: "High progesterone in third trimester supports pregnancy.",
    calculation: "Immunoassay"
  },
 
 
},


"CrAg Test": {
  
  "CSF CrAg": {
    unit: "Positive/Negative",
    reference: { all: ["Negative"] },
    //comment: "Detects Cryptococcus in CSF; positive indicates meningitis.",
    calculation: "Latex agglutination"
  },
  "Serum CrAg": {
    unit: "Positive/Negative",
    reference: { all: ["Negative"] },
    //comment: "Detects Cryptococcus antigen in serum; sensitivity lower than CSF.",
    calculation: "Latex agglutination"
  },
  "Detection LATEX TITRE": {
    unit: "Titre",
    reference: { all: ["<1:8 negative"] },
    //comment: "Higher titre indicates higher antigen load.",
    calculation: "Agglutination"
  },
  "Control LATEX TITRE": {
    unit: "Titre",
    reference: { all: ["Lab-specific control"] },
    //comment: "Control reference for assay.",
    calculation: "Agglutination"
  },
 
},

"Thyroid Function Test ": {
  
  "TSH": {
    unit: "mIU/L",
    reference: { adult: [0.4, 4.0] },
    //comment: "HIGH: hypothyroidism; LOW: hyperthyroidism.",
    calculation: "Immunoassay"
  },
  "Free T3": {
    unit: "pmol/L",
    reference: { adult: [2.6, 5.7] },
    //comment: "Active thyroid hormone; HIGH in hyperthyroidism.",
    calculation: "Immunoassay"
  },
  "Free T4": {
    unit: "pmol/L",
    reference: { adult: [12, 22] },
    //comment: "Main thyroid hormone; interpret with TSH.",
    calculation: "Immunoassay"
  }
},





  "Chemistry Tests": {
    "Blood Glucose (RBS)": {
      unit: "mmol",
      reference: { fasting: [3.9, 5.5], random: [3.9, 7.8], diabetic_target: [4.4, 7.2] },
      comment: "HIGH: hyperglycemia/diabetes; LOW: hypoglycemia. Use fasting/HbA1c for diagnosis.",
      calculation: "Glucose oxidase or hexokinase"
    },
    "Glycosylated Hb (HbA1c)": {
      unit: "%",
      reference: { adult: [4.0, 5.6] },
      //comment: "≥6.5% diagnostic of diabetes; 5.7–6.4% prediabetes. Used for long-term glycemic control.",
      calculation: "HPLC or immunoassay"
    },
    "Uric Acid": {
      unit: "mg/dL",
      reference: { male: [3.4, 7.0], female: [2.4, 6.0] },
      //  comment: "HIGH: gout/renal impairment. LOW: rare (renal wasting or low production).",
      calculation: "Enzymatic colorimetric"
    },
   
     "Magnesium": {
    unit: "mg/dL",
    reference: { adult: [1.7, 2.2] },
    calculation: "Colorimetric"
  },
    
    "Amylase": {
      unit: "U/L",
      reference: { adult: [23, 85] },
      //comment: "HIGH: pancreatitis (also salivary gland disease).",
      calculation: "Enzymatic"
    },
    "Lipase": {
      unit: "U/L",
      reference: { adult: [0, 160] },
      //comment: "HIGH: more specific to pancreatitis than amylase.",
      calculation: "Enzymatic"
    },
    "Iron Studies": {
      Ferritin: {
        unit: "ng/mL",
        reference: { male: [30, 400], female: [15, 150] },
        //comment: "LOW ferritin = iron deficiency. HIGH ferritin may indicate inflammation or iron overload.",
        calculation: "Immunoassay"
      },
      "Serum Iron": {
        unit: "µg/dL",
        reference: { adult: [60, 170] },
        //comment: "Interpreted with TIBC and transferrin saturation.",
        calculation: "Colorimetric"
      },
      "TIBC": {
        unit: "µg/dL",
        reference: { adult: [250, 450] },
        //comment: "HIGH in iron deficiency; LOW in chronic disease.",
        calculation: "Colorimetric"
      },
      "Transferrin Saturation": {
        unit: "%",
        reference: { adult: [20, 50] },
        //comment: "LOW: iron deficiency. HIGH: iron overload.",
        calculation: "TSAT = (Serum Iron / TIBC) * 100"
      },
       "Calcium (total)": {
    unit: "mg/dL",
    reference: { adult: [8.6, 10.2] },
    calculation: "Corrected Ca = measured Ca + 0.8*(4.0 - albumin g/dL) when albumin low"
  }
    },
    "Vitamin B12": {
      unit: "pg/mL",
      reference: { adult: [200, 914] },
    
      calculation: "Immunoassay"
    },
    "Folate": {
      unit: "ng/mL",
      reference: { adult: [3, 17] },
      //comment: "LOW: macrocytic anemia; risk in pregnancy if low.",
      calculation: "Immunoassay"
    },
    "Creatine (CK)": {
      unit: "U/L",
      reference: { male: [38, 174], female: [26, 140] },
      //comment: "HIGH: muscle injury, rhabdomyolysis, myocardial damage if isoenzymes support.",
      calculation: "Enzymatic"
    },
    "BUN": {
      unit: "mg/dL",
      reference: { adult: [7, 20] },
      //comment: "See Urea entry.",
      calculation: "Urease/converted units"
    }
   
  },
   
  "Widal Test": {
    "Salmonella paratyphi AH": {
      unit: "Titre",
      reference: "<1:80"
    },
    "Salmonella paratyphi BH": {
      unit: "Titre",
      reference: "<1:80"
    },
    "Salmonella paratyphi CH": {
      unit: "Titre",
      reference: "<1:80"
    },
    "Salmonella paratyphi AO": {
      unit: "Titre",
      reference: "<1:80"
    },
    "Salmonella paratyphi BO": {
      unit: "Titre",
      reference: "<1:80"
    },
    "Salmonella paratyphi CO": {
      unit: "Titre",
      reference: "<1:80"
    },
    "Salmonella typhi H": {
      unit: "Titre",
      reference: "<1:80"
    },
    "Salmonella typhi O": {
      unit: "Titre",
      reference: "<1:80"
    }
  },

  "Fluid M/C/S": {
    microscopy: {
      "Type": { unit: "", reference: "Clear" },
      "Appearance": { unit: "", reference: "Clear" },
      "Clarity": { unit: "", reference: "Clear" },
      "Clot": { unit: "", reference: "Absent" },
      "WBC's": { unit: "cells/µL", reference: "0–5" },
      "RBC's": { unit: "cells/µL", reference: "0" },
      "Lymphocytes": { unit: "%", reference: "<40%" },
      "Polymorphs": { unit: "%", reference: "<60%" },
      "Other WBC's": { unit: "%", reference: "None" },
      "Organisms": { unit: "", reference: "Not seen" },
      "Protein": { unit: "g/L", reference: "0.15–0.45" }
    },
    culture: {
      "Culture 1": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 2": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 3": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 4": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 5": { unit: "CFU/mL", reference: "<10^3" }
    },
    organisms: {
      "Organism 1": { unit: "", reference: "" },
      "Organism 2": { unit: "", reference: "" },
      "Organism 3": { unit: "", reference: "" },
      "Organism 4": { unit: "", reference: "" },
      "Organism 5": { unit: "", reference: "" }
    },
    drugs: {
      "Amikacin": { unit: "", result: "" },
      "Amoxicillin": { unit: "", result: "" },
      "Ampicillin": { unit: "", result: "" },
      "Augmentin": { unit: "", result: "" },
      "Azithromycin": { unit: "", result: "" },
      "Carbenicillin": { unit: "", result: "" },
      "Cefotaxime": { unit: "", result: "" },
      "Cefoxitin": { unit: "", result: "" },
      "Ceftazidime": { unit: "", result: "" },
      "Ceftriaxone": { unit: "", result: "" },
      "Cefuroxime": { unit: "", result: "" },
      "Cephalophin": { unit: "", result: "" },
      "Cephradine": { unit: "", result: "" },
      "Chloramphenicol": { unit: "", result: "" },
      "Ciprofloxacin": { unit: "", result: "" },
      "Clindamycin": { unit: "", result: "" },
      "Cloxacillin": { unit: "", result: "" },
      "Colistin Sulphate": { unit: "", result: "" },
      "Co-trimoxazole": { unit: "", result: "" },
      "Doxycycline": { unit: "", result: "" },
      "Ertapenem": { unit: "", result: "" },
      "Erythromycin": { unit: "", result: "" },
      "Fusidic Acid": { unit: "", result: "" },
      "Gentamycin": { unit: "", result: "" },
      "Kanamycin": { unit: "", result: "" },
      "Levofloxacin": { unit: "", result: "" },
      "Linezolid": { unit: "", result: "" },
      "Meropenem": { unit: "", result: "" },
      "Metronidazole": { unit: "", result: "" },
      "Nalidixic Acid": { unit: "", result: "" },
      "Nitrofurantoin": { unit: "", result: "" },
      "Nitroxolin": { unit: "", result: "" },
      "Norfloxacin": { unit: "", result: "" },
      "Oxacillin": { unit: "", result: "" },
      "Oxycycline": { unit: "", result: "" },
      "Penicillin": { unit: "", result: "" },
      "Piperacillin": { unit: "", result: "" },
      "Polymyxin B Sulfate": { unit: "", result: "" },
      "Streptomycin": { unit: "", result: "" },
      "Tetracycline": { unit: "", result: "" },
      "Tobramycin": { unit: "", result: "" }
    }
  },

  "Rectal Swab M/C/S": {
    microscopy: {
      "Color": { unit: "", reference: "Brown" },
      "Consistency": { unit: "", reference: "Formed" },
      "Occult blood": { unit: "", reference: "Negative" },
      "WBC": { unit: "/HPF", reference: "0–5" },
      "RBC": { unit: "/HPF", reference: "None" },
      "Mucus": { unit: "", reference: "Absent" },
      "Isospora belli": { unit: "", reference: "Not seen" },
      "Cryptosporidium": { unit: "", reference: "Not seen" },
      "Pit parasites": { unit: "", reference: "Not seen" }
    },
    culture: {
      "Culture 1": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 2": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 3": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 4": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 5": { unit: "CFU/mL", reference: "<10^3" }
    },
    organisms: {
      "Organism 1": { unit: "", reference: "" },
      "Organism 2": { unit: "", reference: "" },
      "Organism 3": { unit: "", reference: "" },
      "Organism 4": { unit: "", reference: "" },
      "Organism 5": { unit: "", reference: "" }
    },
    drugs: {
      "Amikacin": { unit: "", result: "" },
      "Amoxicillin": { unit: "", result: "" },
      "Ampicillin": { unit: "", result: "" },
      "Augmentin": { unit: "", result: "" },
      "Azithromycin": { unit: "", result: "" },
      "Carbenicillin": { unit: "", result: "" },
      "Cefotaxime": { unit: "", result: "" },
      "Cefoxitin": { unit: "", result: "" },
      "Ceftazidime": { unit: "", result: "" },
      "Ceftriaxone": { unit: "", result: "" },
      "Cefuroxime": { unit: "", result: "" },
      "Cephalophin": { unit: "", result: "" },
      "Cephradine": { unit: "", result: "" },
      "Chloramphenicol": { unit: "", result: "" },
      "Ciprofloxacin": { unit: "", result: "" },
      "Clindamycin": { unit: "", result: "" },
      "Cloxacillin": { unit: "", result: "" },
      "Colistin Sulphate": { unit: "", result: "" },
      "Co-trimoxazole": { unit: "", result: "" },
      "Doxycycline": { unit: "", result: "" },
      "Ertapenem": { unit: "", result: "" },
      "Erythromycin": { unit: "", result: "" },
      "Fusidic Acid": { unit: "", result: "" },
      "Gentamycin": { unit: "", result: "" },
      "Kanamycin": { unit: "", result: "" },
      "Levofloxacin": { unit: "", result: "" },
      "Linezolid": { unit: "", result: "" },
      "Meropenem": { unit: "", result: "" },
      "Metronidazole": { unit: "", result: "" },
      "Nalidixic Acid": { unit: "", result: "" },
      "Nitrofurantoin": { unit: "", result: "" },
      "Nitroxolin": { unit: "", result: "" },
      "Norfloxacin": { unit: "", result: "" },
      "Oxacillin": { unit: "", result: "" },
      "Oxycycline": { unit: "", result: "" },
      "Penicillin": { unit: "", result: "" },
      "Piperacillin": { unit: "", result: "" },
      "Polymyxin B Sulfate": { unit: "", result: "" },
      "Streptomycin": { unit: "", result: "" },
      "Tetracycline": { unit: "", result: "" },
      "Tobramycin": { unit: "", result: "" }
    }
  },

  "Urine Microscopy": {
     microscopy: {
    "Type": { unit: "", 
      //reference: "Random/MSU" 
    },
    "Color": { unit: "",
       //reference: "Straw-yellow" 
      },
    "Clarity": { unit: "", 
      //reference: "Clear" 
    },
    "WBC": { unit: "/HPF", 
      //reference: "0–5" 
    },
    "RBC": { unit: "/HPF", 
      //reference: "0–2" 
    },
    "Epithelial cells": { unit: "/HPF", 
      //reference: "Few" 
    },
    "Trichomonas vaginalis": { unit: "", 
      //reference: "Not seen" 
    },
    "Bacteria": { unit: "", 
      //reference: "None/Few" 
    },
    "Schistosoma": { unit: "", 
      //reference: "Not seen" 
    },
    "Casts": { unit: "/LPF", 
      //reference: "None" 
    },
    "Yeasts": { unit: "",
      // reference: "Not seen" 
      },
     },
    culture: {
      "Culture 1": { 
       // unit: "CFU/mL", reference: "<10^3"
       },
      "Culture 2": { 
        //unit: "CFU/mL", reference: "<10^3"
       },
      "Culture 3": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 4": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 5": { unit: "CFU/mL", reference: "<10^3" }
    },
 
   drugs: {
"Amikacin": { unit: "", result: "" },
  "Amoxicillin": { unit: "", result: "" },
  "Ampicillin": { unit: "", result: "" },
  "Augmentin": { unit: "", result: "" },
  "Azithromycin": { unit: "", result: "" },
  "Carbenicillin": { unit: "", result: "" },
  "Cefotaxime": { unit: "", result: "" },
  "Cefoxitin": { unit: "", result: "" },
  "Ceftazidime": { unit: "", result: "" },
  "Ceftriaxone": { unit: "", result: "" },
  "Cefuroxime": { unit: "", result: "" },
  "Cephalophin": { unit: "", result: "" },
  "Cephradine": { unit: "", result: "" },
  "Chloramphenicol": { unit: "", result: "" },
  "Ciprofloxacin": { unit: "", result: "" },
  "Clindamycin": { unit: "", result: "" },
  "Cloxacillin": { unit: "", result: "" },
  "Colistin Sulphate": { unit: "", result: "" },
  "Co-trimoxazole": { unit: "", result: "" },
  "Doxycycline": { unit: "", result: "" },
  "Ertapenem": { unit: "", result: "" },
  "Erythromycin": { unit: "", result: "" },
  "Fusidic Acid": { unit: "", result: "" },
  "Gentamycin": { unit: "", result: "" },
  "Kanamycin": { unit: "", result: "" },
  "Levofloxacin": { unit: "", result: "" },
  "Linezolid": { unit: "", result: "" },
  "Meropenem": { unit: "", result: "" },
  "Metronidazole": { unit: "", result: "" },
  "Nalidixic Acid": { unit: "", result: "" },
  "Nitrofurantoin": { unit: "", result: "" },
  "Nitroxolin": { unit: "", result: "" },
  "Norfloxacin": { unit: "", result: "" },
  "Oxacillin": { unit: "", result: "" },
  "Oxycycline": { unit: "", result: "" },
  "Penicillin": { unit: "", result: "" },
  "Piperacillin": { unit: "", result: "" },
  "Polymyxin B Sulfate": { unit: "", result: "" },
  "Streptomycin": { unit: "", result: "" },
  "Tetracycline": { unit: "", result: "" },
  "Tobramycin": { unit: "", result: "" }
}
  },

  "Urine Chem": {
    
    "Leukocytes": { unit: "", 
     // reference: "Negative" 
    },
     "Nitrite": { unit: "", 
     // reference: "Negative" 
    },
     "Blood": { unit: "", 
     // reference: "Negative" 
    },
    "S.G": { unit: "",
       //reference: "1.005–1.030" 
      },
    "P.H": { unit: "", 
      //reference: "4.5–8.0"
     },
    "Protein": { unit: "mg/dL", 
      //reference: "Negative" 
    },
    "Glucose": { unit: "mg/dL", 
      //reference: "Negative" 
    },
    "Ketones": { unit: "mg/dL", 
      //reference: "Negative" 
    },
    "Urobilinogen": { unit: "EU/dL", 
     // reference: "0.2–1.0"
     },
    "Bilirubin": { unit: "", 
      //reference: "Negative" 
    }
  },

  "Urine Albumin Creatinine Ratio": {
    "U-Albumin": { unit: "mg/L", reference: "<30" },
    "U-Creatine": { unit: "mmol/L", reference: "2–25" },
    "U-Albumin/Crea Ratio": { unit: "mg/g", reference: "<30" }
  },

  "Urine Drug Test": {
    "Amphetamine": { unit: "", 
      //reference: "Negative" 
    },
    "Barbiturate": { unit: "", 
      //reference: "Negative" 
    },
    "Buprenorphine": { unit: "", 
      //reference: "Negative"
     },
    "Benzodiazepine": { unit: "", 
      //reference: "Negative" 
    },
    "Ecstacy": { unit: "", 
      //reference: "Negative"
     },
    "Methamphetamine": { unit: "", 
      //reference: "Negative" 
    },
    "Methadone": { unit: "", 
      //reference: "Negative" 
    },
    "Opiates": { unit: "", 
      //reference: "Negative" 
    },
    "Oxycodone": { unit: "",
       //reference: "Negative" 
      },
    "Phencyclidne": { unit: "", 
      //reference: "Negative" 
    },
    "Antidepressants": { unit: "",
       //reference: "Negative" 
      },
    "Marijuana": { unit: "", 
      //reference: "Negative" 
    }
  },

  "Stool M/C/S": {
    microscopy: {
    "Color": {
      unit: "",
      //reference: "Brown"
    },
    "Consistency": {
      unit: "",
      //reference: "Formed"
    },
    "WBC": {
      unit: "/HPF",
      reference: "0–5"
    },
    "RBC": {
      unit: "/HPF",
      //reference: "None"
    },
    "Mucus": {
      unit: "",
      //reference: "Absent"
    },
     "Ova": {
      unit: "",
      //reference: "Absent"
    },
    "Cysts": {
      unit: "",
      //reference: "Absent"
    },
    "Parasites": {
      unit: "",
     // reference: "Not seen"
    },
  },
      culture: {
      "Culture 1": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 2": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 3": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 4": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 5": { unit: "CFU/mL", reference: "<10^3" }
    },
    organisms: {
      "Organism 1": { unit: "", reference: "" },
      "Organism 2": { unit: "", reference: "" },
      "Organism 3": { unit: "", reference: "" },
      "Organism 4": { unit: "", reference: "" },
      "Organism 5": { unit: "", reference: "" }
    },
   drugs: {
  "Amikacin": { unit: "", result: "" },
  "Amoxicillin": { unit: "", result: "" },
  "Ampicillin": { unit: "", result: "" },
  "Augmentin": { unit: "", result: "" },
  "Azithromycin": { unit: "", result: "" },
  "Carbenicillin": { unit: "", result: "" },
  "Cefotaxime": { unit: "", result: "" },
  "Cefoxitin": { unit: "", result: "" },
  "Ceftazidime": { unit: "", result: "" },
  "Ceftriaxone": { unit: "", result: "" },
  "Cefuroxime": { unit: "", result: "" },
  "Cephalophin": { unit: "", result: "" },
  "Cephradine": { unit: "", result: "" },
  "Chloramphenicol": { unit: "", result: "" },
  "Ciprofloxacin": { unit: "", result: "" },
  "Clindamycin": { unit: "", result: "" },
  "Cloxacillin": { unit: "", result: "" },
  "Colistin Sulphate": { unit: "", result: "" },
  "Co-trimoxazole": { unit: "", result: "" },
  "Doxycycline": { unit: "", result: "" },
  "Ertapenem": { unit: "", result: "" },
  "Erythromycin": { unit: "", result: "" },
  "Fusidic Acid": { unit: "", result: "" },
  "Gentamycin": { unit: "", result: "" },
  "Kanamycin": { unit: "", result: "" },
  "Levofloxacin": { unit: "", result: "" },
  "Linezolid": { unit: "", result: "" },
  "Meropenem": { unit: "", result: "" },
  "Metronidazole": { unit: "", result: "" },
  "Nalidixic Acid": { unit: "", result: "" },
  "Nitrofurantoin": { unit: "", result: "" },
  "Nitroxolin": { unit: "", result: "" },
  "Norfloxacin": { unit: "", result: "" },
  "Oxacillin": { unit: "", result: "" },
  "Oxycycline": { unit: "", result: "" },
  "Penicillin": { unit: "", result: "" },
  "Piperacillin": { unit: "", result: "" },
  "Polymyxin B Sulfate": { unit: "", result: "" },
  "Streptomycin": { unit: "", result: "" },
  "Tetracycline": { unit: "", result: "" },
  "Tobramycin": { unit: "", result: "" }
}
  },

  "Sputum AAFBS": {
    "Appearance": {
      unit: "",
      //reference: "Mucoid"
    },
    "ZN Slide 1": {
      unit: "",
     // reference: "Negative"
    },
    "ZN Slide 2": {
      unit: "",
      //reference: "Negative"
    },
    "ZN Slide 3": {
      unit: "",
      //reference: "Negative"
    }
  },

  "Swab M/C/S": {
     microscopy: {
    "Gram stain": {
      unit: "",
      //reference: "Normal flora"
    },
    "Bacteria": {
      unit: "",
      //reference: "Normal flora / None"
    },
    "WBC": {
      unit: "/HPF",
      reference: "0–5"
    },
    "RBC": {
      unit: "/HPF",
      //reference: "None"
    },
    "Epithelial cells": {
      unit: "/HPF",
      //reference: "Few"
    },
    "Clue cells": {
      unit: "",
      //reference: "Absent"
    },
    "T-Vaginalis": {
      unit: "",
      //reference: "Not seen"
    },
    "Yeasts/Buds": {
      unit: "",
      //reference: "Not seen"
    },
    "Lactobacilli": {
      unit: "",
      //reference: "Present"
    },
    "Organisms": {
      unit: "",
        //reference: "None / Normal flora"
    },
    "Other": {
      unit: "",
     // reference: "None"
    },
     },
      culture: {
      "Culture 1": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 2": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 3": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 4": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 5": { unit: "CFU/mL", reference: "<10^3" }
    },
    organisms: {
      "Organism 1": { unit: "", reference: "" },
      "Organism 2": { unit: "", reference: "" },
      "Organism 3": { unit: "", reference: "" },
      "Organism 4": { unit: "", reference: "" },
      "Organism 5": { unit: "", reference: "" }
    },
   drugs: {
  "Amikacin": { unit: "", result: "" },
  "Amoxicillin": { unit: "", result: "" },
  "Ampicillin": { unit: "", result: "" },
  "Augmentin": { unit: "", result: "" },
  "Azithromycin": { unit: "", result: "" },
  "Carbenicillin": { unit: "", result: "" },
  "Cefotaxime": { unit: "", result: "" },
  "Cefoxitin": { unit: "", result: "" },
  "Ceftazidime": { unit: "", result: "" },
  "Ceftriaxone": { unit: "", result: "" },
  "Cefuroxime": { unit: "", result: "" },
  "Cephalophin": { unit: "", result: "" },
  "Cephradine": { unit: "", result: "" },
  "Chloramphenicol": { unit: "", result: "" },
  "Ciprofloxacin": { unit: "", result: "" },
  "Clindamycin": { unit: "", result: "" },
  "Cloxacillin": { unit: "", result: "" },
  "Colistin Sulphate": { unit: "", result: "" },
  "Co-trimoxazole": { unit: "", result: "" },
  "Doxycycline": { unit: "", result: "" },
  "Ertapenem": { unit: "", result: "" },
  "Erythromycin": { unit: "", result: "" },
  "Fusidic Acid": { unit: "", result: "" },
  "Gentamycin": { unit: "", result: "" },
  "Kanamycin": { unit: "", result: "" },
  "Levofloxacin": { unit: "", result: "" },
  "Linezolid": { unit: "", result: "" },
  "Meropenem": { unit: "", result: "" },
  "Metronidazole": { unit: "", result: "" },
  "Nalidixic Acid": { unit: "", result: "" },
  "Nitrofurantoin": { unit: "", result: "" },
  "Nitroxolin": { unit: "", result: "" },
  "Norfloxacin": { unit: "", result: "" },
  "Oxacillin": { unit: "", result: "" },
  "Oxycycline": { unit: "", result: "" },
  "Penicillin": { unit: "", result: "" },
  "Piperacillin": { unit: "", result: "" },
  "Polymyxin B Sulfate": { unit: "", result: "" },
  "Streptomycin": { unit: "", result: "" },
  "Tetracycline": { unit: "", result: "" },
  "Tobramycin": { unit: "", result: "" }
}
  },

"Sputum M/C/S": {
  microscopy: {
    "Epithelial cells": {
      unit: "/LPF",
//reference: "Few"
    },
    "Appearance": {
      unit: "",
      //reference: "Mucoid"
    },
    "WBC": {
      unit: "/HPF",
      //reference: "Few"
    },
    "RBC": {
      unit: "/HPF",
      //reference: "None"
    },
    "Organisms": {
      unit: "",
      //reference: "None"
    },
    "Other": {
      unit: "",
      //reference: "None"
    },
    "ZN STAIN": {
      unit: "",
      //reference: "Negative"
    },
    "GRAM STAIN": {
      unit: "",
      //reference: "Normal flora"
    },
    "ZN Slide 3": {
      unit: "",
      //reference: "Negative"
    },
  },
      culture: {
      "Culture 1": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 2": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 3": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 4": { unit: "CFU/mL", reference: "<10^3" },
      "Culture 5": { unit: "CFU/mL", reference: "<10^3" }
    },
    organisms: {
      "Organism 1": { unit: "", reference: "" },
      "Organism 2": { unit: "", reference: "" },
      "Organism 3": { unit: "", reference: "" },
      "Organism 4": { unit: "", reference: "" },
      "Organism 5": { unit: "", reference: "" }
    },
    drugs: {
  "Amikacin": { unit: "", result: "" },
  "Amoxicillin": { unit: "", result: "" },
  "Ampicillin": { unit: "", result: "" },
  "Augmentin": { unit: "", result: "" },
  "Azithromycin": { unit: "", result: "" },
  "Carbenicillin": { unit: "", result: "" },
  "Cefotaxime": { unit: "", result: "" },
  "Cefoxitin": { unit: "", result: "" },
  "Ceftazidime": { unit: "", result: "" },
  "Ceftriaxone": { unit: "", result: "" },
  "Cefuroxime": { unit: "", result: "" },
  "Cephalophin": { unit: "", result: "" },
  "Cephradine": { unit: "", result: "" },
  "Chloramphenicol": { unit: "", result: "" },
  "Ciprofloxacin": { unit: "", result: "" },
  "Clindamycin": { unit: "", result: "" },
  "Cloxacillin": { unit: "", result: "" },
  "Colistin Sulphate": { unit: "", result: "" },
  "Co-trimoxazole": { unit: "", result: "" },
  "Doxycycline": { unit: "", result: "" },
  "Ertapenem": { unit: "", result: "" },
  "Erythromycin": { unit: "", result: "" },
  "Fusidic Acid": { unit: "", result: "" },
  "Gentamycin": { unit: "", result: "" },
  "Kanamycin": { unit: "", result: "" },
  "Levofloxacin": { unit: "", result: "" },
  "Linezolid": { unit: "", result: "" },
  "Meropenem": { unit: "", result: "" },
  "Metronidazole": { unit: "", result: "" },
  "Nalidixic Acid": { unit: "", result: "" },
  "Nitrofurantoin": { unit: "", result: "" },
  "Nitroxolin": { unit: "", result: "" },
  "Norfloxacin": { unit: "", result: "" },
  "Oxacillin": { unit: "", result: "" },
  "Oxycycline": { unit: "", result: "" },
  "Penicillin": { unit: "", result: "" },
  "Piperacillin": { unit: "", result: "" },
  "Polymyxin B Sulfate": { unit: "", result: "" },
  "Streptomycin": { unit: "", result: "" },
  "Tetracycline": { unit: "", result: "" },
  "Tobramycin": { unit: "", result: "" }
}
    
  },


  

  "Sputum for Gene Xpert": {
    "Gene Xpert": {
      unit: "",
      //reference: "MTB Not Detected"
    }
  },

  "Microbiology": {
    "Malaria Test": {
      unit: "Positive/Negative or parasites/µL (microscopy)",
      //reference: { all: ["Negative"] }
    },
    "Urine Culture": {
      unit: "CFU/mL",
      //reference: { adult: ["<10^3: no significant growth; ≥10^5 often significant; cutoffs lab-dependent"] }
    },
    "Blood Culture": {
      unit: "Positive/Negative; organism ID",
      //reference: { all: ["Negative"] }
    },
    "Sputum Culture": {
      unit: "CFU/mL / organism ID",
      //reference: { all: ["Depends on pathogen"] }
    },
    "Stool Culture": {
      unit: "Organism ID",
      //reference: { all: ["Not detected"] }
    },
    "Throat Swab Culture": {
      unit: "Organism ID",
      //reference: { all: ["No pathogenic growth (depends)"] }
    },
    "Antibiotic Sensitivity Test": {
      unit: "S/I/R (susceptible/intermediate/resistant)",
      //reference: { all: ["Interpret per CLSI/EUCAST breakpoints"] }
    },
    "Urinalysis": {
      unit: "Various (pH, protein, blood, nitrite, LE, glucose)",
      //reference: { all: ["Parameter-specific; dipstick cutoffs lab dependent"] }
    },
    "Microscopy (direct)": {
      unit: "Qualitative",
      // reference: { all: ["Absent/Present"] }
    },
    "KOH Prep": {
      unit: "Positive/Negative",
      //reference: { all: ["Negative"] }
    },
    "Fungal Culture": {
      unit: "Growth/No growth",
      //reference: { all: ["No growth"] }
    },
    "CSF Culture": {
      unit: "Organism ID / Not detected",
      //reference: { all: ["Sterile"] }
    }
  },

  "TB Tests": {
    "PCR TB": {
      //unit: "Detected/Not detected (Ct optional)",
      //reference: { all: ["Not detected"] },
      //comment: "DETECTED: MTB DNA present — rapid evidence of infection, sensitivity depends on specimen. NOT DETECTED: may not rule out TB particularly in paucibacillary disease.",
      calculation: "NAAT/PCR"
    },
    "Tuberculosis GeneXpert": {
     // unit: "Detected/Not detected; RIF resistance flagged",
      //reference: { all: ["Not detected"] },
      //comment: "DETECTED: MTB complex; specific rifampicin resistance flagged — helpful for rapid treatment decisions.",
      calculation: "Xpert MTB/RIF cartridge (RT-PCR)"
    },
    "Mantoux Test (TST)": {
      unit: "mm induration",
      //reference: { all: { thresholds: "5/10/15 mm depending on risk group" } },
      //comment: "Positive induration suggests latent or active TB exposure — interpret with BCG history and risk factors.",
      calculation: "Intradermal PPD, read 48–72 hours"
    },
    "TB Culture": {
      unit: "Growth / organism ID",
      //reference: { all: ["No growth (sterile)"] },
      //comment: "Culture confirms TB and allows susceptibility testing (slow but gold standard).",
      calculation: "Solid/liquid mycobacterial media"
    },
    "AFB Smear": {
      unit: "Acid-fast bacilli seen/not seen",
      //reference: { all: ["Not seen"] },
      //comment: "AFB POSITIVE: high suspicion for mycobacterial infection; low sensitivity for paucibacillary disease.",
      calculation: "Ziehl-Neelsen or fluorescent staining"
    }
  },

  "Hepatitis A": {
    "Hepatitis A IgM": {
      unit: "",
     // reference: "Negative",
     // comment: "Positive indicates acute or recent Hepatitis A infection."
    },
    "Hepatitis A IgG": {
      unit: "",
      //reference: "Negative",
      //comment: "Positive indicates past infection or immunity (vaccination)."
    }
  },

  "Hepatitis B": {
    "HBsAg": {
      unit: "",
      //reference: "Negative",
      //  comment: "Positive indicates active Hepatitis B infection."
    },
    "HBsAb": {
      unit: "mIU/mL",
      reference: ">10",
      //  comment: "Protective immunity due to vaccination or recovery."
    },
    "HBeAg": {
      unit: "",
      reference: "Negative",
      //comment: "Positive indicates active viral replication and high infectivity."
    },
    "HBeAb": {
      unit: "",
      //reference: "Negative",
      //comment: "Positive suggests reduced viral replication."
    },
    "HBcAb": {
      unit: "",
      //reference: "Negative",
      //comment: "Indicates previous or ongoing infection (not from vaccination)."
    }
    },

    "HPV Tests": {
    "HPV 16": {
      //unit: "Detected/Not Detected",
      //reference: { all: ["Not Detected"] },
      //comment: "DETECTED: high-risk HPV 16 — higher risk for cervical cancer; follow local screening/colposcopy guidelines.",
      calculation: "PCR-based genotyping"
    },
    "HPV 18": {
      //unit: "Detected/Not Detected",
      //reference: { all: ["Not Detected"] },
      //comment: "DETECTED: high-risk HPV 18 — risk for cervical/other cancers.",
      calculation: "PCR genotyping"
    },
    "HPV 31": {
       //unit: "Detected/Not Detected", 
       //reference: { all: ["Not Detected"] },
        //comment: "High-risk HPV — follow screening guidance.", 
        calculation: "PCR" },
    "HPV 33": { 
      //unit: "Detected/Not Detected", 
      //reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 35": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.",
       calculation: "PCR" },
    "HPV 39": { 
      //unit: "Detected/Not Detected", 
      //reference: { all: ["Not Detected"] }, 
      //comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 45": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.",
       calculation: "PCR" },
    "HPV 51": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.",
       calculation: "PCR" },
    "HPV 52": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 56": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.",
       calculation: "PCR" },
    "HPV 58": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 59": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.",
       calculation: "PCR" },
    "HPV 66": {
       //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV; lower oncogenic risk than 16/18.", 
       calculation: "PCR" },
    "HPV 68": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
    calculation: "PCR" },
 
    "HPV 6": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (genital warts), not strongly oncogenic.",
       calculation: "PCR" },
    "HPV 11": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (warts).", 
      calculation: "PCR" },
    "HPV 40": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 42": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 43": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 44": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 54": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 61": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 70": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 72": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 81": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" }
  },

  "HPV HR PCR Tests": {
    "HPV 16": {
      //unit: "Detected/Not Detected",
      //reference: { all: ["Not Detected"] },
      //comment: "DETECTED: high-risk HPV 16 — higher risk for cervical cancer; follow local screening/colposcopy guidelines.",
      calculation: "PCR-based genotyping"
    },
    "HPV 18": {
      //unit: "Detected/Not Detected",
      //reference: { all: ["Not Detected"] },
      //comment: "DETECTED: high-risk HPV 18 — risk for cervical/other cancers.",
      calculation: "PCR genotyping"
    },
    "HPV 31": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV — follow screening guidance.", 
      calculation: "PCR" },
    "HPV 33": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 35": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 39": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 45": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 51": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 52": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 56": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 58": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 59": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" },
    "HPV 66": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV; lower oncogenic risk than 16/18.", 
      calculation: "PCR" },
    "HPV 68": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", 
      calculation: "PCR" }
  },

  "Viral Load": {
    "HIV RNA (Viral Load)": {
      unit: "copies/mL",
      reference: "<50",
      comment: "Undetectable viral load (<50 copies/mL) indicates effective antiretroviral therapy. Detectable or rising levels suggest poor adherence, treatment failure, or resistance. Interpret alongside CD4 count and clinical status."
    }
  },

  "HPV LR PCR Tests": {
    "HPV 6": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (genital warts), not strongly oncogenic.", 
      calculation: "PCR" },
    "HPV 11": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (warts).", 
      calculation: "PCR" },
    "HPV 40": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 42": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 43": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 44": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 54": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 61": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 70": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 72": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" },
    "HPV 81": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", 
      calculation: "PCR" }
  },

"HIV Test": {
    "Determine": {
      unit: "",
      reference: "Negative",
      comment: "Screening test. Positive result requires confirmation with a second rapid test."
    },
    "CHEMBIO": {
      unit: "",
      reference: "Negative",
      comment: "Confirmatory rapid test if initial screening is positive."
    },
    "INSTI": {
      unit: "",
      reference: "Negative",
      comment: "Tie-breaker rapid test used when results are discordant."
    },
    "Final Result": {
      unit: "",
      reference: "Negative",
      comment: "Final HIV status based on national serial testing algorithm."
    }
  },

 "STI 12PCR Panel": {
  comment: "Interpret results collectively. DETECTED indicates potential infection requiring appropriate clinical management or treatment; NOT DETECTED suggests no NAAT/PCR evidence of infection. Always consider clinical context and symptoms.",
  "Neisseria gonorrhoeae": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT/PCR" 
  },
  "Chlamydia trachomatis": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Treponema pallidum": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "PCR" 
  },
  "Trichomonas vaginalis": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT or microscopy" 
  },
  "Ureaplasma urealyticum": { 
    //unit: "Detected/Not Detected", 
    //  reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Ureaplasma parvum": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Mycoplasma genitalium": { 
      //unit: "Detected/Not Detected", 
    //  reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Mycoplasma hominis": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT or culture" 
  },
  "HSV 1": { 
    //unit: "Detected/Not Detected (PCR) or IgG/IgM)", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "PCR/Serology" 
  },
  "HSV 2": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "PCR/Serology" 
  },
  "Candida Albicans": { 
   // unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "Culture/NAAT" 
  },
  "Gardnerella vaginalis": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT/culture" 
  }
},

"STI 6PCR Panel": {
  //comment: "Interpret results collectively. DETECTED indicates potential infection requiring appropriate clinical management or treatment; NOT DETECTED suggests no NAAT/PCR evidence of infection. Always consider clinical context and symptoms.",
  "Neisseria gonorrhoeae": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT/PCR" 
  },
  "Chlamydia trachomatis": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Treponema pallidum": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "PCR" 
  },
 
  "Ureaplasma urealyticum": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
 
  "Mycoplasma genitalium": { 
//unit: "Detected/Not Detected", 
      //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Mycoplasma hominis": { 
    //unit: "Detected/Not Detected", 
    //reference: { all: ["Not Detected"] }, 
    calculation: "NAAT or culture" 
  }
},

  "Molecular Tests": {
    "DNA Extraction (yield)": {
      unit: "ng/µL",
      //reference: { all: ["Lab QC thresholds; e.g., >10 ng/µL for many NGS workflows"] },
      //comment: "LOW yield may cause assay failure; purity (A260/280 ~1.8) important.",
      calculation: "Spectrophotometry (A260) or fluorometry (Qubit)"
    },
    "BRCA 1/2 Mutation Analysis": {
     // unit: "Report: classification (Pathogenic/Likely Pathogenic/VUS/Benign)",
      reference: { all: ["No pathogenic variant (wild-type) or classified variant"] },
      //comment: "PATHOGENIC: increased hereditary breast/ovarian cancer risk; VUS: uncertain significance — manage per guidelines.",
      calculation: "NGS panel with confirmatory Sanger when needed"
    },
    "HIV Viral Load": {
      unit: "copies/mL",
      reference: { all: ["Undetectable (< assay LOD e.g., <20-50 copies/mL)"] },
      //comment: "Detectable: active replication; Undetectable indicates effective therapy (assay-specific).",
      calculation: "qPCR"
    },
    "Hepatitis B Viral Load": {
      unit: "IU/mL",
      reference: { all: ["Undetectable or assay-specific LLOQ"] },
      //comment: "Detectable: active replication — quantify for treatment decisions.",
      calculation: "qPCR"
    },
    "Hepatitis C Viral Load": {
      unit: "IU/mL",
      reference: { all: ["Undetectable or assay-specific LLOQ"] },
      //comment: "Used to assess active infection and SVR after therapy.",
      calculation: "qPCR"
    },
    "COVID-19 PCR": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: SARS-CoV-2 RNA present; Ct values semi-quantitative; correlate with clinical picture.", 
      calculation: "RT-PCR" },
    "Influenza PCR": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: influenza virus; directs antiviral therapy.", 
    calculation: "RT-PCR" },
    "RSV PCR": { 
      //unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: RSV infection (important in infants/elderly).", 
    calculation: "RT-PCR" },
    "HBV Genotyping": { 
      //unit: "Genotype (A,B,C...)", reference: { all: ["N/A"] }, comment: "Genotype influences disease course and therapy choices in some contexts.", 
    calculation: "Sequencing/line probe assays" },
    "HCV Genotyping": { 
      //unit: "Genotype", reference: { all: ["N/A"] }, comment: "Genotype informs treatment selection (historically).", 
    calculation: "Sequencing/line probe"
    }
  },

  "NGS (Next-Generation Sequencing)": {
    "Whole Genome Sequencing": {
      unit: "Report (variants list/classification)",
      reference: { all: ["No actionable pathogenic variants found or list of variants"] },
      comment: "Report includes pathogenic/likely pathogenic variants and VUS; clinical correlation required.",
      calculation: "High-throughput sequencing and bioinformatics pipeline"
    },
    "Whole Exome Sequencing": {
      unit: "Report",
      reference: { all: ["Lab dependent"] },
      comment: "Targets protein-coding regions — useful for Mendelian disorders; VUS common.",
      calculation: "Exome capture + NGS"
    },
    "RNA Sequencing": { unit: "Expression counts/variants", reference: { all: ["Lab dependent"] }, comment: "Used for expression profiling or fusion detection.", calculation: "RNA-Seq pipeline" },
    "Cancer Gene Panel": { unit: "Report of actionable variants", reference: { all: ["Lab dependent"] }, comment: "Targets clinically actionable mutations to guide therapy.", calculation: "Targeted NGS panels" },
    "Hereditary Cancer Panel": { unit: "Report", reference: { all: ["Lab dependent"] }, comment: "Assesses germline variants predisposing to hereditary cancer syndromes.", calculation: "NGS + confirmatory assays" },
    "Pharmacogenomics Panel": { unit: "Genotype / phenotype", reference: { all: ["N/A"] }, comment: "Interprets gene variants that affect drug metabolism and dosing.", calculation: "Targeted genotyping/NGS" },
    "BRCA NGS": { unit: "Variants classification", reference: { all: ["See BRCA entry"] }, comment: "NGS-based detection of BRCA variants; pathogenic variants impact management.", calculation: "Targeted NGS"
    },
    "HLA Typing NGS": { unit: "Alleles reported", reference: { all: ["N/A"] }, comment: "Used for transplant matching and disease associations.", calculation: "NGS-based HLA typing" }
  },

  "Prenatal / Pregnancy": {
    "NIPT (Non-Invasive Prenatal Test)": {
      unit: "Risk/Detected vs Not Detected",
      reference: { all: ["Low risk / High risk per lab thresholds"] },
      comment: "High risk suggests increased probability of common aneuploidies — confirm with invasive diagnostic test (CVS/amniocentesis).",
      calculation: "Cell-free DNA sequencing (bioinformatics risk scoring)"
    },
    "BhCG Quantitative (prenatal)": { unit: "mIU/mL", reference: { female: { "non-pregnant": [0, 5], "pregnancy": "gestation-dependent" } }, comment: "See BhCG entry.", calculation: "Immunoassay" },
    "Fetal DNA Screening": { unit: "Risk/Detected/Not detected", reference: { all: ["N/A"] }, comment: "As NIPT; confirm positives diagnostically.", calculation: "cfDNA sequencing" },
    "Maternal Serum Screening / Quad": { unit: "MoM (multiples of median)", reference: { all: ["Lab/gestation dependent"] }, comment: "Abnormal MoMs indicate increased risk of aneuploidy or NTDs; follow up with diagnostic tests.", calculation: "Combines AFP, hCG, estriol, inhibin-A adjusted to median" }
  },

  "Paternity & Forensics": {
    "Standard Paternity Test": {
      unit: "Probability (%) and match loci",
      reference: { all: ["Report: probability of paternity and loci match; >99.9% considered confirmed in many labs"] },
      comment: "High probability indicates paternity; chain-of-custody and accredited lab required for legal use.",
      calculation: "STR analysis (PCR) with population allele frequency statistics"
    },
    "Extended Family Test": { unit: "Probability and loci", reference: { all: ["N/A"] }, comment: "Used when direct paternity not possible; interpretation via kinship analysis.", calculation: "STR panels" },
    "Forensic DNA Profiling": { unit: "Profile/match", reference: { all: ["N/A"] }, comment: "Used for identification; database matches depend on loci overlap.", calculation: "STR/mtDNA/Y-STR" },
    "Ancestry DNA Testing": { unit: "Population percentages", reference: { all: ["N/A"] }, comment: "Provides estimated ancestry composition; not medical.", calculation: "SNP genotyping / reference population models" }
  },

  "Allergy Tests": {
    "Food Allergy Panel (specific IgE)": {
      unit: "kU/L (or class 0–6)",
      reference: { all: ["Lab bins: Negative / Low / Moderate / High"] },
      comment: "POSITIVE: sensitization. Clinical allergy requires correlation and possibly oral food challenge.",
      calculation: "Specific IgE immunoassay (ImmunoCAP etc.)"
    },
    "Environmental Allergy Panel": { unit: "kU/L", reference: { all: ["See above"] }, comment: "Sensitization vs clinical allergy needs correlation.", calculation: "Specific IgE assays" },
    "Skin Prick Test": { unit: "Wheal mm", reference: { all: ["Interpret vs negative/positive control"] }, comment: "Wheal > control indicates sensitization; correlate clinically.", calculation: "Prick testing" },
    "Drug Allergy Testing (IgE or skin)": { unit: "Result or challenge", reference: { all: ["N/A"] }, comment: "Positive IgE suggests immediate-type allergy; many drug allergies require supervised challenge.", calculation: "Skin/serology/drug challenge under supervision" }
  },

  "Toxicology": {
    "Alcohol Level": { unit: "mg/dL or %BAC", reference: { all: ["0 (legal limits vary)"] }, comment: "Elevated indicates recent alcohol ingestion; correlate with clinical signs.", calculation: "Enzymatic assays or GC" },
    "Heavy Metals Panel": { unit: "µg/dL or µg/L", reference: { all: ["Element specific reference; follow public health limits"] }, comment: "Elevated indicates exposure — interpret by element, acute vs chronic levels.", calculation: "ICP-MS or AAS" },
    "Lead": { unit: "µg/dL", reference: { child: [0, 5], adult: [0, 10] }, comment: "Elevated: lead exposure; requires public health action and chelation at high levels.", calculation: "AAS/ICP-MS" },
    "Arsenic": { unit: "µg/L", reference: { all: ["Speciation and sample (urine/blood) dependent"] }, comment: "Inorganic arsenic elevated in toxic exposure; speciation needed.", calculation: "ICP-MS" },
    "Mercury": { unit: "µg/L", reference: { all: ["Speciation-dependent"] }, comment: "Elevated with exposure; interpret by species (methylmercury vs inorganic).", calculation: "ICP-MS" },
    "Comprehensive Drug Screening": { unit: "Positive/Negative (and concentration)", reference: { all: ["Negative below cutoffs"] }, comment: "Positive indicates recent exposure; confirm with GC/LC-MS/MS for legal decisions.", calculation: "Immunoassay screen + confirm MS" }
  },

  "Food & Water Safety": {
    "Water Microbiology (E. coli)": {
      unit: "Presence/absence in 100 mL or CFU/100 mL",
      reference: { all: ["No E. coli in 100 mL for potable water (regulatory)"] },
      comment: "Presence indicates fecal contamination — public health action required.",
      calculation: "Membrane filtration culture / PCR"
    },
    "Food Pathogen Test (Salmonella/Listeria/E.coli O157)": {
      unit: "Detected/Not Detected",
      reference: { all: ["Not Detected"] },
      comment: "Detection indicates contamination and food safety risk requiring recall/investigation.",
      calculation: "Culture + PCR confirmation"
    },
    "Chemical Residues (Pesticides, Mycotoxins)": {
      unit: "µg/kg (ppb)",
      reference: { all: ["Regulatory MLs by country"] },
      comment: "Above regulatory limit = safety risk.",
      calculation: "LC-MS/MS / GC-MS"
    }
  },

  "Infectious Disease Panels": {
    "Respiratory Panel PCR": { unit: "Detected/Not Detected per pathogen", reference: { all: ["Not Detected"] }, comment: "Detects viral/bacterial respiratory pathogens; interpret with clinical findings.", calculation: "Multiplex PCR" },
    "Gastrointestinal PCR Panel": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Detects enteric pathogens; positive identifies likely cause of diarrhea.", calculation: "Multiplex PCR" },
    "Meningitis/Encephalitis PCR Panel": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Detection in CSF indicates CNS infection — urgent management.", calculation: "Multiplex PCR" },
    "Sepsis PCR Panel": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Rapid detection supports early targeted therapy; negative does not rule out bacteremia.", calculation: "Molecular sepsis panels" },
    "Zoonotic Diseases Panel": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Detects occupational/exposure-related pathogens; interpret with exposure history.", calculation: "PCR/serology" }
  },

  // Additional generic/derived calculations
  "Calculations": {
    "LDL (Friedewald)": {
      unit: "mg/dL",
      reference: { note: "Valid when TG < 400 mg/dL" },
      comment: "Estimated LDL for routine testing. If TG high, use direct LDL assay.",
      calculation: "LDL = Total Cholesterol - HDL - (Triglycerides / 5)"
    },
    "Transferrin Saturation": {
      unit: "%",
      reference: { adult: [20, 50] },
      comment: "Low = iron deficiency. High = iron overload.",
      calculation: "TSAT = (Serum Iron / TIBC) * 100"
    },
    "Creatinine Clearance (Cockcroft-Gault)": {
      unit: "mL/min",
      reference: { adult: ["Age/sex dependent; used for drug dosing"] },
      comment: "Estimate of creatinine clearance; less used now vs eGFR but used for drug dosing.",
      calculation: "CrCl (male) = ((140 - age) * weight kg) / (72 * SCr mg/dL). For females multiply result by 0.85."
    },
     "Anion Gap (corrected)": {
      unit: "mmol/L",
      reference: { adult: [8, 12] },
      comment: "Correct for low albumin: AG_corrected = AG + 2.5*(4.0 - albumin g/dL).",
      calculation: "AG = Na - (Cl + HCO3)"
    },
   
    "eGFR (CKD-EPI)": {
      unit: "mL/min/1.73m2",
      reference: { adult: [">90 normal"] },
      comment: "CKD staging; method varies by equation (CKD-EPI recommended).",
      calculation: "Use CKD-EPI equation with age, sex, creatinine, race adjustment if specified by lab"
    }
  }
};





/* ============================================================
   DEFAULT TEST CATEGORIES (merged into the system)
   ============================================================ */

const default_tests = {
  "Tumor Markers": [
    "PSA","CA-125","CEA","AFP","CA 19-9","CA 15-3","CA 72-4","Thyroglobulin",
    "Calcitonin","Beta-2 Microglobulin","NSE","CYFRA 21-1","LDH","HE4"
  ],
  "Serology": [
    "HIV test","BhCG","Widal","HbsAg","HSV","Syphilis","H.pylori","CRP","RF","TORCH",
    "ANA","Allergy","Urine Drug Test","Hepatitis A IgM","Hepatitis C Antibody",
    "Rubella","Measles IgG/IgM","Varicella-Zoster IgG/IgM","COVID-19 IgG/IgM",
    "Dengue NS1 IgM/IgG","Zika IgM","Yellow Fever Antibody","Bilharzia Serology"
  ],
  "Full Blood Count (FBC)": [
    "WBC","RBC","HB","HCT","MCV","MCH","MCHC","RDW","Platelets",
    "Neutrophils (%)","Lymphocytes (%)","Granulocytes (%)",
    "Neutrophils","Lymphocytes","Granulocytes"
  ],
  "Hematology": [
    "PDW","Reticulocyte Count","Peripheral Blood Smear","ESR","INR","D-Dimer",
    "Folic Acid","Lactic acid","Retic Count"
  ],
  "Chemistry Tests": [
    "Blood Glucose (RBS)","Fasting Blood Sugar","Serum Iron Levels","Serum Amylase",
    "Uric Acid","Total Cholesterol","HDL Cholesterol",
    "LDL Cholesterol","VLDL Cholesterol","Triglycerides","Urea","ALT","AST",
    "LFT","GGT","Total Bilirubin","Sodium","Potassium","Bicarbonate","Calcium",
    "Magnesium","Glycosylated Hb","Creatine","Creatinine","BUN","Albumin",
    "Total Protein","Amylase","Lipase","Iron Studies","Ferritin","Transferrin",
    "Vitamin B12","Folate"
  ],
  Microbiology: [
    "Malaria Test","Urine Culture","Blood Culture","Sputum Culture","Stool Culture",
    "Throat Swab Culture","Antibiotic Sensitivity Test","Urinalysis","Microscopy",
    "KOH Prep","Fungal Culture","CSF Culture"
  ],
  "TB Tests": ["PCR TB","Tuberculosis GeneXpert","Mantoux Test","TB Culture","AFB Smear"],
  "HPV Tests - High Risk": [
    "HPV 16","HPV 18","HPV 31","HPV 33","HPV 35","HPV 39","HPV 45",
    "HPV 51","HPV 52","HPV 56","HPV 58","HPV 59","HPV 66","HPV 68"
  ],
  "HPV Tests - Low Risk": [
    "HPV 6","HPV 11","HPV 40","HPV 42","HPV 43","HPV 44","HPV 54","HPV 61",
    "HPV 70","HPV 72","HPV 81"
  ],
  "STI Molecular Panel": [
    "Neisseria gonorrhoeae","Chlamydia trachomatis","Treponema pallidum",
    "Trichomonas vaginalis","Ureaplasma urealyticum","Ureaplasma parvum",
    "Mycoplasma genitalium","Mycoplasma hominis","HSV 1","HSV 2",
    "Candida Albicans","Gardnerella vaginalis"
  ],
  "Molecular Tests": [
    "DNA Extraction","BRCA 1/2 Mutation Analysis","HIV Viral Load",
    "Hepatitis B Viral Load","Hepatitis C Viral Load","COVID-19 PCR",
    "Influenza PCR","RSV PCR","HBV Genotyping","HCV Genotyping"
  ],
  "NGS (Next-Generation Sequencing)": [
    "Whole Genome Sequencing","Whole Exome Sequencing","RNA Sequencing",
    "Cancer Gene Panel","Hereditary Cancer Panel","Pharmacogenomics Panel",
    "Mitochondrial Genome Sequencing","Microbiome Sequencing","BRCA NGS",
    "HLA Typing NGS"
  ],
  "Prenatal / Pregnancy": [
    "NIPT (Non-Invasive Prenatal Test)", "BhCG Quantitative",
    "Fetal DNA Screening", "Maternal Serum Screening",
    "Amniocentesis Genetic Panel", "Quad Screening"
  ],
  "Paternity & Forensics": [
    "Standard Paternity Test", "Extended Family Test",
    "Forensic DNA Profiling", "Ancestry DNA Testing",
    "Y-STR Profiling", "mtDNA Profiling"
  ],
  "Allergy Tests": [
    "Food Allergy Panel", "Environmental Allergy Panel",
    "Drug Allergy Panel", "Egg Allergy", "Milk Allergy",
    "Fish Allergy", "Nuts Allergy", "Pollen Allergy",
    "Dust Mite Allergy", "Protia Allergy Test"
  ],
  "Toxicology": [
    "Alcohol Level", "Heavy Metals Panel", "Lead", "Arsenic", "Mercury",
    "Comprehensive Drug Screening", "Prescription Drug Monitoring"
  ],
  "Food & Water Safety": [
    "Water Microbiology", "Water Chemical Analysis",
    "Food Pathogen Test", "Salmonella Test", "Listeria Test",
    "E.coli O157:H7 Test", "Food Heavy Metals",
    "Mycotoxin Screening", "Pesticide Residue Test"
  ],
  "Infectious Disease Panels": [
    "Respiratory Panel PCR", "Gastrointestinal PCR Panel",
    "Meningitis PCR Panel", "Sepsis PCR Panel", "Zoonotic Diseases Panel"
  ]
};

/* Final category source = lab_reference keys */
const allCategories = Object.keys(lab_reference);

// Keyboard navigation helper for Results table
const handleResultKeyDown = (e, currentIdx, fieldType, testsInCategory) => {
  if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift+Enter for new lines in textarea
    e.preventDefault();
    
    // Move to next row's result field directly
    const nextRowIdx = currentIdx + 1;
    if (nextRowIdx < testsInCategory.length) {
      const nextRowResult = document.querySelector(`input[data-result-idx="${nextRowIdx}"]`);
      if (nextRowResult) {
        nextRowResult.focus();
        return;
      }
    }
    
    // If at last row, move to first row's result field
    const firstResult = document.querySelector(`input[data-result-idx="0"]`);
    if (firstResult) {
      firstResult.focus();
    }
  }
};

const getSelectedTestKey = (test) => `${test.category}::${test.name}::${test.subTab || ""}`;

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const TestResultsTab = ({
  selectedTests = [],
  setSelectedTests = () => {},
  patient = {},
  selectedRequest = null,
  setSelectedRequest = () => {},
  onSave = null,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState("microscopy");


  const microCategories = [
    "Urine Microscopy",
    "Fluid M/C/S",
    "Rectal Swab M/C/S",
    "Swab M/C/S",
    "Sputum M/C/S",
    "Stool M/C/S",
    
  ];

  const microSubTabs = ["microscopy", "culture", "drugs"];

  const detectionCategories = [
    "STI 12PCR Panel",
    "STI 6PCR Panel",
    "HPV Tests",
    "HPV HR PCR Tests",
    "HPV LR PCR Tests",
  ];

  const drugSensitivityOptions = ["Sensitive", "Intermediate", "Resistant"];
  const detectionOptions = ["Positive", "Negative"];

  const categories = useMemo(() => {
    if (selectedTests.length > 0) {
      const selectedCats = [...new Set(selectedTests.map(t => t.category))];
      return allCategories.filter(c => selectedCats.includes(c));
    } else {
      return allCategories;
    }
  }, [selectedTests]);

  React.useEffect(() => {
    if (selectedCategory >= categories.length && categories.length > 0) {
      setSelectedCategory(0);
    }
  }, [categories.length]);

  /* Initialize tests with reference data and units */
  React.useEffect(() => {
    if (selectedTests.length > 0 && !initialized) {
      const enrichedTests = selectedTests.map((test) => {
        // Skip if already enriched
        if (test.unit && test.refRange !== undefined) return test;

        const referenceInfo = lab_reference[test.category]?.[test.name];
        
        if (referenceInfo) {
          let refRangeStr = "";
          if (referenceInfo.reference) {
            if (Array.isArray(referenceInfo.reference)) {
              refRangeStr = `${referenceInfo.reference[0]} - ${referenceInfo.reference[1]}`;
            } else if (typeof referenceInfo.reference === "object") {
              // Object with age/sex keys or special keys like random/fasting/diabetic_target
              const ref = referenceInfo.reference.adult || referenceInfo.reference.all || referenceInfo.reference.random || referenceInfo.reference.fasting || referenceInfo.reference.diabetic_target;
              if (Array.isArray(ref)) {
                refRangeStr = `${ref[0]} - ${ref[1]}`;
              } else if (typeof ref === "string") {
                refRangeStr = ref;
              }
            }
          }

          let computedFlag = test.flag || "";
          if (!computedFlag && test.result && !isNaN(parseFloat(test.result))) {
            const interpreted = interpretLabTest({
              testName: test.name,
              value: test.result,
              age: patient.dob ? dayjs().diff(dayjs(patient.dob), "year") : null,
              sex: patient.gender || null,
              referenceInfo,
            });
            computedFlag = interpreted.flag;
          }

          return {
            ...test,
            unit: referenceInfo.unit || test.unit || "",
            refRange: refRangeStr,
            comment: test.comment || referenceInfo.comment || "",
            flag: computedFlag,
          };
        }

        return test;
      });

      setSelectedTests(enrichedTests);
      setInitialized(true);
    }
  }, [selectedTests.length, initialized, setSelectedTests]);


const testsInCategory = useMemo(() => {

  const catName = categories[selectedCategory] || "";

  const isMicroTest = microCategories.includes(catName);

  if (isMicroTest && selectedSubTab) {
    const subTabData = lab_reference[catName]?.[selectedSubTab];

    if (!subTabData) return [];

    const parentTest = selectedTests.find((t) => t.category === catName && !t.subTab);
    const parentLabTestId = parentTest?.id || null;

    return Object.entries(subTabData).map(([name, data]) => {
      const id = `${catName}-${selectedSubTab}-${name}`;
      const existing = selectedTests.find((t) => t.id === id);

      const cultureOrganism = selectedSubTab === "culture" ? (existing?.result || existing?.comment || "") : (existing?.result || "");
      const cultureIncubation = selectedSubTab === "culture" ? (existing?.incubation || existing?.refRange || "") : (existing?.incubation || "");

      return {
        id,
        name,
        category: catName,
        subTab: selectedSubTab,
        labTestId: existing?.labTestId || parentLabTestId,
        unit: existing?.unit || data.unit || "",
        refRange: existing?.refRange || (Array.isArray(data.reference) ? `${data.reference[0]} - ${data.reference[1]}` : data.reference || ""),
        incubation: cultureIncubation,
        result: cultureOrganism,
        flag: existing?.flag || "",
        comment: existing?.comment || "",
      };
    });
  }

  const filteredTests = selectedTests.filter((t) => t.category === catName);
  const uniqueTests = [];
  const seen = new Set();

  filteredTests.forEach((test) => {
    const key = getSelectedTestKey(test);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTests.push(test);
    }
  });

  if (catName === "Full Blood Count (FBC)") {
    const FBC_ORDER = [
      "WBC",
      "RBC",
      "HB",
      "HCT",
      "MCV",
      "MCH",
      "MCHC",
      "RDW",
      "Platelets",
      "Neutrophils (%)",
      "Lymphocytes (%)",
      "Monocytes (%)",
      "Neutrophils",
      "Monocytes",
      "Lymphocytes",
      "Granulocytes (%)",
      "Granulocytes",
    ];

    // Normalize function for robust name comparisons (ignore case/extra spaces)
    const norm = (s) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\s*\(\s*/g, "(")
        .replace(/\s*\)\s*/g, ")");

    // Map normalized name -> tests preserving original order
    const nameMap = new Map();
    uniqueTests.forEach((t) => {
      const k = norm(t.name);
      if (!nameMap.has(k)) nameMap.set(k, []);
      nameMap.get(k).push(t);
    });

    const ordered = [];
    FBC_ORDER.forEach((name) => {
      const k = norm(name);
      const matches = nameMap.get(k) || [];
      matches.forEach((m) => ordered.push(m));
      nameMap.delete(k);
    });

    // Append any remaining tests that were not in the FBC_ORDER
    const remaining = [];
    nameMap.forEach((arr) => remaining.push(...arr));
    return [...ordered, ...remaining];
  }

  return uniqueTests;

}, [selectedCategory, selectedTests, selectedSubTab, categories]);

  const isCultureGrid = selectedSubTab === "culture" && microCategories.includes(categories[selectedCategory]);
  const isDrugSensitivityGrid = selectedSubTab === "drugs" && microCategories.includes(categories[selectedCategory]);
  const isDetectionCategory = detectionCategories.includes(categories[selectedCategory]);

  React.useEffect(() => {
    const catName = categories[selectedCategory] || "";
    if (microCategories.includes(catName) && !microSubTabs.includes(selectedSubTab)) {
      setSelectedSubTab("microscopy");
    }
  }, [categories, selectedCategory, selectedSubTab]);

  const handleSubTabChange = (subTab) => {
    setSelectedSubTab(subTab);
  };

  const handleResultChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    // Calculate flag based on result
    const referenceInfo = lab_reference[test.category]?.[test.name];
    const interpreted = interpretLabTest({
      testName: test.name,
      value,
      age: patient.dob ? dayjs().diff(dayjs(patient.dob), "year") : null,
      sex: patient.gender || null,
      referenceInfo
    });

    const updatedTest = {
      id: test.id,
      name: test.name,
      category: test.category,
      subTab: test.subTab || "",
      labTestId: test.labTestId || test.id,
      result: value,
      unit: test.unit || "",
      refRange: test.refRange || "",
      flag: interpreted.flag,
      comment: test.comment || "",
      incubation: test.incubation || "",
    };

    if (realIndex === -1) {
      updated.push(updatedTest);
    } else {
      updated[realIndex] = {
        ...updated[realIndex],
        ...updatedTest,
      };
    }

    setSelectedTests(updated);
  };


  const handleCommentChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    const updatedTest = {
      id: test.id,
      name: test.name,
      category: test.category,
      subTab: test.subTab || "",
      labTestId: test.labTestId || test.id,
      result: test.result || "",
      unit: test.unit || "",
      refRange: test.refRange || "",
      flag: test.flag || "",
      comment: value,
    };

    if (realIndex === -1) {
      updated.push(updatedTest);
    } else {
      updated[realIndex] = {
        ...updated[realIndex],
        ...updatedTest,
      };
    }

    setSelectedTests(updated);
  };

  const handleIncubationChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    const updatedTest = {
      id: test.id,
      name: test.name,
      category: test.category,
      subTab: test.subTab || "",
      labTestId: test.labTestId || test.id,
      result: test.result || "",
      unit: test.unit || "",
      refRange: test.refRange || "",
      incubation: value,
      flag: test.flag || "",
      comment: test.comment || "",
    };

    if (realIndex === -1) {
      updated.push(updatedTest);
    } else {
      updated[realIndex] = {
        ...updated[realIndex],
        ...updatedTest,
      };
    }

    setSelectedTests(updated);
  };

  const handleNameChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    const updatedTest = {
      id: test.id,
      name: value,
      category: test.category,
      subTab: test.subTab || "",
      labTestId: test.labTestId || test.id,
      result: test.result || "",
      unit: test.unit || "",
      refRange: test.refRange || "",
      flag: test.flag || "",
      comment: test.comment || "",
    };

    if (realIndex === -1) {
      updated.push(updatedTest);
    } else {
      updated[realIndex] = {
        ...updated[realIndex],
        ...updatedTest,
      };
    }

    setSelectedTests(updated);
  };

  const handleRefRangeChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    // Parse the new reference range (format: "min - max")
    let newFlag = "";
    const resultValue = test.result || "";
    if (resultValue && !isNaN(parseFloat(resultValue)) && value) {
      const parts = value.split("-").map((p) => p.trim());
      if (parts.length === 2) {
        const refMin = parseFloat(parts[0]);
        const refMax = parseFloat(parts[1]);
        const numValue = parseFloat(resultValue);
        
        if (!isNaN(refMin) && !isNaN(refMax)) {
          if (numValue < refMin) newFlag = "L";
          else if (numValue > refMax) newFlag = "H";
        }
      }
    }

    const updatedTest = {
      id: test.id,
      name: test.name,
      category: test.category,
      subTab: test.subTab || "",
      labTestId: test.labTestId || test.id,
      result: resultValue,
      unit: test.unit || "",
      refRange: value,
      flag: newFlag,
      comment: test.comment || "",
    };

    if (realIndex === -1) {
      updated.push(updatedTest);
    } else {
      updated[realIndex] = {
        ...updated[realIndex],
        ...updatedTest,
      };
    }

    setSelectedTests(updated);
  };

  const handleUnitChange = (idx, value) => {
    const test = testsInCategory[idx];
    const updated = [...selectedTests];
    const realIndex = selectedTests.findIndex((t) => t.id === test.id);

    const updatedTest = {
      id: test.id,
      name: test.name,
      category: test.category,
      subTab: test.subTab || "",
      labTestId: test.labTestId || test.id,
      result: test.result || "",
      unit: value,
      refRange: test.refRange || "",
      flag: test.flag || "",
      comment: test.comment || "",
    };

    if (realIndex === -1) {
      updated.push(updatedTest);
    } else {
      updated[realIndex] = {
        ...updated[realIndex],
        ...updatedTest,
      };
    }

    setSelectedTests(updated);
  };



  

  
  const handleSave = async () => {
    if (typeof onSave === "function") {
      await onSave({ auto: false });
      return;
    }

    if (!selectedRequest) {
      alert("No request selected");
      return;
    }

    try {
      await Promise.all(
        selectedTests
          .filter((test) => test.result || test.comment)
          .map((test) =>
            axios.post(`${API}/lab-results/save`, {
              patient_id: Number(selectedRequest.patient_id),
              lab_request_id: Number(selectedRequest.id),
              lab_test_id: Number(test.labTestId || test.id),
              test_name: test.name,
              results: test.result ?? "",
              unit: test.unit ?? "",
              ref_range: isCultureGrid ? test.incubation ?? "" : test.refRange ?? "",
              flag: test.flag ?? "",
              comment: isCultureGrid ? "" : test.comment ?? "",
            })
          )
      );

      await axios.patch(`${API}/lab-requests/${selectedRequest.id}`, {
        status: "Completed",
      });

      alert("Results saved successfully");
    } catch (err) {
      console.error(err);
      alert("Save failed – check console");
    }
  };

  const handleReset = async () => {
    if (!selectedRequest) return;

    try {
      const res = await axios.get(`${API}/lab-requests/${selectedRequest.id}/results/`);
      setSelectedTests((prev) =>
        prev.map((t) => {
          const saved = res.data.find((r) => r.lab_test_id === t.labTestId || r.lab_test_id === t.id);
          return saved ? { ...t, result: saved.results, comment: saved.comment } : { ...t, result: "", comment: "" };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };




  const cytologyLbcRef = lab_reference?.["Cytology"]?.["LBC"] || {};
  const isCytologyLbcSelected = selectedTests?.some(
    (t) => t?.category === "Cytology" && t?.name === "LBC"
  );

  const isCytologyTabActive = categories[selectedCategory] === "Cytology";



  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        mt: 2,
        height: "85vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6">Test Results Entry</Typography>

      {/* ----- CATEGORY TABS ----- */}
      <Box sx={{ overflowX: "auto", mt: 1 }}>
        <Tabs
          value={selectedCategory}
          onChange={(e, v) => setSelectedCategory(v)}
          variant="scrollable"
          scrollButtons
        >
          {categories.map((c) => (
            <Tab key={c} label={c} />
          ))}
        </Tabs>
      </Box>

      

      {/* Subtab Navigation for Microbiology */}
    {["Urine Microscopy", "Fluid M/C/S", "Rectal Swab M/C/S", "Swab M/C/S", "Sputum M/C/S", "Stool M/C/S"].includes(categories[selectedCategory]) && (
      <Box sx={{ mt: 1, mb: 1 }}>
        <Tabs 
          value={selectedSubTab} 
          onChange={(e, v) => handleSubTabChange(v)}
          variant="fullWidth"
          size="small"
        >
          <Tab label="Microscopy" value="microscopy" />
          <Tab label="Culture" value="culture" />
          <Tab label="Drugs" value="drugs" />
        </Tabs>
      </Box>
    )}

      {/* ----- LBC CUSTOM DISPLAY (Cytology tab only; render ONLY LBC Report) ----- */}
      {isCytologyTabActive && isCytologyLbcSelected && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            bgcolor: "#fafafa",
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            LBC Report (Cytology)
          </Typography>

          <Stack direction="column" spacing={1}>
            <TextField
              size="small"
              label="Clinical Data (Clinicai Data)"
              value={
                selectedTests?.find((t) => t.category === "Cytology" && t.name === "LBC")?.clinicai_data ??
                cytologyLbcRef?.["Clinicai Data"] ??
                ""
              }
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTests((prev) =>
                  prev.map((t) =>
                    t.category === "Cytology" && t.name === "LBC" ? { ...t, clinicai_data: v } : t
                  )
                );
              }}
              multiline
              fullWidth
            />

            <TextField
              size="small"
              label="Nature of Specimen"
              value={selectedTests?.find((t) => t.category === "Cytology" && t.name === "LBC")?.nature_of_specimen || ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTests((prev) =>
                  prev.map((t) =>
                    t.category === "Cytology" && t.name === "LBC" ? { ...t, nature_of_specimen: v } : t
                  )
                );
              }}
              multiline
              fullWidth
            />

            <TextField
              size="small"
              label="Specimen Adequacy"
              value={selectedTests?.find((t) => t.category === "Cytology" && t.name === "LBC")?.specimen_adequacy || ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTests((prev) =>
                  prev.map((t) =>
                    t.category === "Cytology" && t.name === "LBC" ? { ...t, specimen_adequacy: v } : t
                  )
                );
              }}
              multiline
              fullWidth
            />

            <TextField
              size="small"
              label="Epithelial Abnormalities"
              value={selectedTests?.find((t) => t.category === "Cytology" && t.name === "LBC")?.epithelial_abnormalities || ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTests((prev) =>
                  prev.map((t) =>
                    t.category === "Cytology" && t.name === "LBC" ? { ...t, epithelial_abnormalities: v } : t
                  )
                );
              }}
              multiline
              fullWidth
            />

            <TextField
              size="small"
              label="Diagnosis"
              value={selectedTests?.find((t) => t.category === "Cytology" && t.name === "LBC")?.diagnosis || ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTests((prev) =>
                  prev.map((t) =>
                    t.category === "Cytology" && t.name === "LBC" ? { ...t, diagnosis: v } : t
                  )
                );
              }}
              multiline
              fullWidth
            />

            <TextField
              size="small"
              label="Recommendation"
              value={selectedTests?.find((t) => t.category === "Cytology" && t.name === "LBC")?.recommendation || ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTests((prev) =>
                  prev.map((t) =>
                    t.category === "Cytology" && t.name === "LBC" ? { ...t, recommendation: v } : t
                  )
                );
              }}
              multiline
              fullWidth
            />

            <TextField
              size="small"
              label="Comment"
              value={selectedTests?.find((t) => t.category === "Cytology" && t.name === "LBC")?.comment || ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTests((prev) =>
                  prev.map((t) =>
                    t.category === "Cytology" && t.name === "LBC" ? { ...t, comment: v } : t
                  )
                );
              }}
              multiline
              fullWidth
            />
          </Stack>
        </Box>
      )}



      {/* ----- TABLE ----- */}
      {(() => {
        // If LBC test is selected, remove the entire cytology table area
        if (isCytologyTabActive && isCytologyLbcSelected) return null;

        const catName = categories[selectedCategory] || "";
        console.log(
          "🔍 DEBUG TestResultsTab: Category:",
          catName,
          "Tests in category:",
          testsInCategory.length,
          testsInCategory.map((t) => ({ name: t.name, id: t.id }))
        );
        return null;
      })()}

      <Box sx={{ flexGrow: 1, overflow: "auto", mt: 2 }}>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    background: "#fafafa",
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                  }}
                >
                  {isCultureGrid ? "Culture" : "Test"}
                </TableCell>
                <TableCell>{isCultureGrid ? "Organism Identified" : "Result"}</TableCell>
                <TableCell>{isCultureGrid ? "Growth Density" : "Unit"}</TableCell>
                <TableCell>{isCultureGrid ? "Incubation Period" : "Reference"}</TableCell>
                {!isCultureGrid && <TableCell>Comment</TableCell>}
                {!isCultureGrid && <TableCell>Flag</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {testsInCategory.length ? (
                testsInCategory.map((test, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      sx={{ background: "#fff", position: "sticky", left: 0 }}
                    >
                      {isCultureGrid ? (
                        <TextField
                          size="small"
                          fullWidth
                          value={test.name || ""}
                          onChange={(e) => handleNameChange(idx, e.target.value)}
                          onKeyDown={(e) => handleResultKeyDown(e, idx, 'name', testsInCategory)}
                          inputProps={{ 'data-name-idx': idx }}
                        />
                      ) : (
                        test.name
                      )}
                    </TableCell>

                    <TableCell>
                      {isDrugSensitivityGrid || isDetectionCategory ? (
                        <Select
                          size="small"
                          fullWidth
                          value={test.result || ""}
                          onChange={(e) => handleResultChange(idx, e.target.value)}
                          onKeyDown={(e) => handleResultKeyDown(e, idx, 'result', testsInCategory)}
                          displayEmpty
                          inputProps={{ 'data-result-idx': idx }}
                        >
                          {(isDrugSensitivityGrid ? drugSensitivityOptions : detectionOptions).map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <TextField
                          size="small"
                          fullWidth
                          value={test.result || ""}
                          onChange={(e) => handleResultChange(idx, e.target.value)}
                          onKeyDown={(e) => handleResultKeyDown(e, idx, 'result', testsInCategory)}
                          inputProps={{ 'data-result-idx': idx }}
                        />
                      )}
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={test.unit || ""}
                        onChange={(e) => handleUnitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleResultKeyDown(e, idx, isCultureGrid ? 'unit' : 'unit', testsInCategory)}
                        inputProps={{ 'data-unit-idx': idx }}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={isCultureGrid ? test.incubation || "" : test.refRange || ""}
                        onChange={(e) => isCultureGrid ? handleIncubationChange(idx, e.target.value) : handleRefRangeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleResultKeyDown(e, idx, isCultureGrid ? 'incubation' : 'ref', testsInCategory)}
                        inputProps={{ [isCultureGrid ? 'data-incubation-idx' : 'data-ref-idx']: idx }}
                      />
                    </TableCell>

                    {!isCultureGrid && (
                      <TableCell>
                        <TextField
                          size="small"
                          value={test.comment || ""}
                          onChange={(e) => handleCommentChange(idx, e.target.value)}
                          onKeyDown={(e) => handleResultKeyDown(e, idx, 'comment', testsInCategory)}
                          inputProps={{ 'data-comment-idx': idx }}
                          multiline
                          fullWidth
                        />
                      </TableCell>
                    )}

                    {!isCultureGrid && (
                      <TableCell
                        style={{
                          fontWeight: "bold",
                        }}
                      >
                        {test.flag || ""}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isCultureGrid ? 3 : 6} align="center">
                    No tests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

     
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleReset}>
          Reset
        </Button>
      </Box>
    </Paper>
  );
};

export default TestResultsTab;