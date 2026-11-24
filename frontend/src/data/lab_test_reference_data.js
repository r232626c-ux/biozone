// lab_test_reference_data.js

export const lab_reference = {
  "Tumor Markers": {
    "PSA": {
      unit: "ng/mL",
      reference: {
        male: {
          "<50": [0, 2.5],
          "50-59": [0, 3.5],
          "60-69": [0, 4.5],
          "70+": [0, 6.5]
        }
      },
      comment:
        "HIGH: suggests prostate disease (BPH, prostatitis) or prostate cancer; HIGHER risk with values > age-specific upper limit. LOW: within expected. Trend/velocity matters. POSITIVE/NEGATIVE not applicable.",
      calculation: "Immunoassay (total PSA). Use age-specific cutoffs; consider free/total ratio for better specificity."
    },
    "CA-125": {
      unit: "U/mL",
      reference: { female: { all: [0, 35] } },
      comment:
        "HIGH: ovarian malignancy suspicion, but can be high with menstruation, endometriosis, inflammation. LOW: normal. Best for trend monitoring post-diagnosis.",
      calculation: "Immunoassay/ELISA"
    },
    "CEA": {
      unit: "ng/mL",
      reference: { adult: [0, 3] },
      comment:
        "HIGH: colorectal and other adenocarcinomas; smoking elevates baseline. LOW: normal. Monitor trends for recurrence.",
      calculation: "Immunoassay"
    },
    "AFP": {
      unit: "ng/mL",
      reference: { adult: [0, 10] },
      comment: "HIGH: hepatocellular carcinoma, germ cell tumors; LOW: normal. Use with imaging and other markers.",
      calculation: "Immunoassay"
    },
    "CA 19-9": {
      unit: "U/mL",
      reference: { adult: [0, 37] },
      comment: "HIGH: pancreatic/biliary malignancy; benign biliary obstruction can raise it. LOW: normal.",
      calculation: "Immunoassay"
    },
    "CA 15-3": {
      unit: "U/mL",
      reference: { adult: [0, 31.3] },
      comment: "HIGH: used to monitor breast cancer burden/recurrence; not for screening. LOW: normal.",
      calculation: "Immunoassay"
    },
    "CA 72-4": {
      unit: "U/mL",
      reference: { adult: [0, 6.9] },
      comment: "HIGH: GI/gastric tumors associated; adjunct marker.",
      calculation: "Immunoassay"
    },
    "Thyroglobulin": {
      unit: "ng/mL",
      reference: { adult: [0, 55] },
      comment:
        "HIGH after thyroidectomy may indicate residual/recurrent thyroid cancer; interpret with anti-thyroglobulin antibodies.",
      calculation: "Immunoassay"
    },
    "Calcitonin": {
      unit: "pg/mL",
      reference: { adult: [0, 10] },
      comment: "HIGH: medullary thyroid carcinoma suspicion; very high values more specific.",
      calculation: "Immunoassay"
    },
    "Beta-2 Microglobulin": {
      unit: "mg/L",
      reference: { adult: [0.8, 2.2] },
      comment:
        "HIGH: renal dysfunction, hematologic malignancies; LOW: typical.",
      calculation: "Immunoassay"
    },
    "NSE": {
      unit: "ng/mL",
      reference: { adult: [0, 12] },
      comment: "HIGH: neuroendocrine tumors, small cell lung cancer; LOW: typical.",
      calculation: "Immunoassay"
    },
    "CYFRA 21-1": {
      unit: "ng/mL",
      reference: { adult: [0, 3.3] },
      comment: "HIGH: NSCLC (esp. squamous cell); LOW: typical.",
      calculation: "Immunoassay"
    },
    "LDH": {
      unit: "U/L",
      reference: { adult: [140, 280] },
      comment:
        "HIGH: nonspecific marker of tissue damage, hemolysis, tumor burden; LOW: rare clinically.",
      calculation: "Enzymatic assay"
    },
    "HE4": {
      unit: "pmol/L",
      reference: { female: { all: [0, 70] } },
      comment:
        "HIGH: ovarian cancer marker (used with CA-125 & algorithms like ROMA).",
      calculation: "Immunoassay"
    }
  },
  "Serology": {
    "HIV test": {
      unit: "Reactive/Non-reactive (Positive/Negative)",
      reference: { all: ["Non-reactive"] },
      comment:
        "REACTIVE: likely HIV infection — confirm with differentiation assay or NAAT per algorithm. NON-REACTIVE: no detection; consider window period if recent exposure.",
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
      comment: "HIGH titers may suggest typhoid/paratyphoid but interpretation limited by background/previous infection or vaccination.",
      calculation: "Agglutination"
    },
    "HbsAg": {
      unit: "Reactive/Non-reactive",
      reference: { all: ["Non-reactive"] },
      comment: "REACTIVE: current Hepatitis B infection (acute or chronic). NON-REACTIVE: no surface antigen detected (may need anti-HBc to detect prior exposure).",
      calculation: "Immunoassay"
    },
    "HSV": {
      unit: "IgG/IgM or PCR",
      reference: { all: ["IgG negative if no prior exposure; IgM negative if no acute infection"] },
      comment: "IgM positive may suggest recent infection (false positives possible). IgG positive indicates prior exposure. PCR of lesion best for acute disease.",
      calculation: "Serology or PCR"
    },
    "Syphilis": {
      unit: "Reactive/Non-reactive (RPR/VDRL + confirmatory treponemal)",
      reference: { all: ["Non-reactive"] },
      comment: "REACTIVE: likely syphilis — confirm with treponemal test; titer helps stage/monitor therapy. NON-REACTIVE: no serologic evidence, but early window possible.",
      calculation: "Non-treponemal + treponemal algorithms"
    },
    "Bilharzia Serology": {
      unit: "Reactive/Non-reactive",
      reference: { all: ["Non-reactive"] },
      comment: "Interpret according to the assay method and clinical context; serology may reflect current or past exposure.",
      calculation: "Serological antibody assay"
    },
    "H.pylori": {
      unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
    },
    "CRP": {
      unit: "mg/L",
      reference: { adult: [0, 7] },
      comment: "HIGH: acute inflammation/infection. CRP 10–40 mg/L often viral/mild inflammation; >40 mg/L suggests bacterial/severe inflammation.",
      calculation: "Immunoturbidimetry"
    },
    "RF": {
      unit: "IU/mL",
      reference: "0 - 14 ",
      comment: "HIGH: associated with rheumatoid arthritis and other autoimmune conditions. LOW: typical.",
      calculation: "ELISA or nephelometry"
    },
    "ANA": {
      unit: "Titer (e.g., 1:80)",
      reference: { all: ["Negative or <1:80 (lab dependent)"] },
      comment: "POSITIVE: suggests autoimmune process (SLE, etc.) — pattern/titer and clinical context determine significance; low titers can be nonspecific.",
      calculation: "Indirect immunofluorescence or ELISA"
    },
    "Allergy tests (IgE/skin)": {
      unit: "kU/L (IgE) / wheal mm (skin)",
      reference: { all: ["Depends on specific allergen and lab bins"] },
      comment: "POSITIVE/sensitization indicates immune response; clinical allergy requires correlation with history and sometimes challenge tests.",
      calculation: "Specific IgE immunoassay or skin prick measurement"
    },
    "Urine Drug Test": {
      unit: "Positive/Negative and concentration µg/mL",
      reference: { all: ["Negative below assay cutoffs; Positive if above cutoff"] },
      comment: "POSITIVE: recent exposure (window varies by drug and matrix); confirm positives with GC-MS/LC-MS/MS for legal/clinical decisions.",
      calculation: "Immunoassay screen; confirm by mass spectrometry"
    },
    "TORCH": {
      unit: "IgM/IgG Reactive/Non-reactive",
      reference: { all: ["Non-reactive IgM (no acute infection); IgG depends on immunity/exposure"] },
      comment: "IgM POSITIVE suggests recent/acute infection (careful of false positives); IgG POSITIVE indicates past exposure or immunity.",
      calculation: "Serology panels (ELISA)"
    },
    "Measles/ Rubella/ Varicella / Dengue / Zika / Yellow Fever": {
      unit: "IgG/IgM Reactive/Non-reactive",
      reference: { all: ["Non-reactive IgM in naive; IgG varies"] },
      comment: "IgM indicates recent infection; IgG indicates prior exposure or immunity. Use PCR in acute PCR-window for high sensitivity.",
      calculation: "ELISA or PCR when appropriate"
    }
  },

  "Full Blood Count (FBC)": {
  comment: "Interpret all values together; abnormalities may indicate infection, inflammation, anemia, bone marrow disorders, or hematologic diseases. Consider trends and clinical context.",
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
    reference: { adult: [2, 10] },
    calculation: "CBC differential"
  },
  "Granulocytes (%)": {
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
    reference: { adult: [0.2, 0.8]  },
    calculation: "CBC differential"
  },
  "Granulocytes": {
    unit: "10^9/L ",
    reference: { adult:  [0.2, 1]  },
    calculation: "CBC differential"
  },
 
},

   "Hematology ": {
    "PDW": {
      unit: "%",
      reference: { adult: ["lab dependent; qualitative"] },
      comment: "Platelet distribution width — high suggests variability in platelet size.",
      calculation: "Analyzer"
    },
    "Reticulocyte Count": {
      unit: "%",
      reference: { adult: [0.5, 2.5] },
      comment: "HIGH: marrow response to anemia/hemolysis. LOW: inadequate marrow response.",
      calculation: "Automated or manual supravital staining"
    },
    "Peripheral Blood Smear": {
      unit: "Morphology",
      reference: { all: ["Normal morphology"] },
      comment: "Qualitative morphology — abnormal shapes (schistocytes, blasts, hypersegmented neutrophils) guide diagnosis.",
      calculation: "Microscopy"
    },
    "ESR": {
      unit: "mm/hr",
      reference: { male: [0, 15], female: [0, 20] },
      comment: "Elevated: nonspecific inflammation. Trends useful.",
      calculation: "Westergren method"
    },
    "INR": {
      unit: "ratio",
      reference: { adult: [0.96, 1.2] },
      comment: "HIGH: anticoagulation effect or clotting factor deficiency; monitor warfarin therapy.",
      calculation: "Derived from PT"
    },
    "D-Dimer": {
      unit: "mg/L",
      reference: { adult: [0, 0.5] },
      comment: "HIGH: possible clot breakdown (DVT/PE) but nonspecific (inflammation, malignancy). Normal helps rule-out PE in low-risk patients.",
      calculation: "Immunoassay"
    }
  },

  "Urea & Electrolytes": {
  comment: "Interpret values collectively; abnormalities may indicate kidney dysfunction, fluid/electrolyte imbalance, acid-base disorders, or endocrine issues. Consider clinical context and trends.",
   "Sodium": {
    unit: "mmol/L",
    reference: { adult: [135, 147] },
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
  "Creatinine (CR-S)": {
    unit: "mmol/L",
    reference: { adult: [58, 110] },
    calculation: "Jaffe or enzymatic assays"
  },
  "Anion Gap (corrected)": {
      unit: "mmol/L",
      reference: { adult: [8, 12] },
      calculation: "AG = Na - (Cl + HCO3)"
    },
  "eGFR": {
      unit: "mL/min/1.73m2",
      reference: { adult: [80, 1000000000] },
      calculation: "CKD-EPI or MDRD equations"
    }
},

  "LFT (Liver Function Test)": {
  comment: "Interpret results collectively to assess hepatocellular injury, cholestasis, and liver synthetic function. Abnormalities should be correlated with clinical findings, medications, alcohol use, and imaging where appropriate.",
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
  comment: "Interpret results collectively to assess hepatocellular injury, cholestasis, and liver synthetic function. Abnormalities should be correlated with clinical findings, medications, alcohol use, and imaging where appropriate.",
 
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
    unit: "IU/L",
    reference: { adult: [] }
  
  }
},

"Serum Iron Studies": {
  comment: "Interpret results collectively to assess hepatocellular injury, cholestasis, and liver synthetic function. Abnormalities should be correlated with clinical findings, medications, alcohol use, and imaging where appropriate.",

  "Iron": {
    unit: "umol/L",
    reference: { adult: [9, 30.4] },
    calculation: "Diazo method or enzymatic"
  },
  "Transferrin": {
    unit: "umol/L",
    reference: { adult: [25.4, 45] },
    calculation: "Diazo method or enzymatic"
  },
  "% Iron saturation": {
    unit: "%",
    reference: { adult: [12, 45] },
    calculation: "Bromocresol green or purple"
  },
  "Ferritin": {
    unit: "ng/L",
    reference: { adult: [13, 232] },
    calculation: "Biuret"
  },
  "TIBC": {
    unit: "umol/L",
    reference: { adult: [44.8, 806] },
    calculation: "Biuret"
  },
  "Soluble transferrin receptor": {
    unit: "nmol/L",
    reference: { adult: [8.7, 28] }
  
  }
},

"CAMP": {
  comment: "Interpret results collectively to assess hepatocellular injury, cholestasis, and liver synthetic function. Abnormalities should be correlated with clinical findings, medications, alcohol use, and imaging where appropriate.",

  "Calcium": {
    unit: "mmol/L",
    reference: { adult: [21, 255] },
    calculation: "Diazo method or enzymatic"
  },
  "Albumin": {
    unit: "g/L",
    reference: { adult: [35, 50] },
    calculation: "Diazo method or enzymatic"
  },
  "Magnesium": {
    unit: "mmol/L",
    reference: { adult: [0.74, 15] },
    calculation: "Bromocresol green or purple"
  },
  "Phosphate": {
    unit: "mmol/L",
    reference: { adult: [0.74, 1.52] },
    calculation: "Biuret"
  },
  "Corrected calcium": {
    unit: "",
    reference: { adult: [] },
    calculation: "Biuret"
  },
 
},



"Cardiac Enzymes": {
  comment: "Interpret results collectively to assess hepatocellular injury, cholestasis, and liver synthetic function. Abnormalities should be correlated with clinical findings, medications, alcohol use, and imaging where appropriate.",

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
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
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
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "Serum Insulin": {
    unit: "uIU/ml",
    reference: { adult: [1.96, 23.76] },
    calculation: "Enzymatic method"
  }
 
},

"RPR, TPHA": {
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "RPR": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "TPHA": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  }
 
},

"H.pylori": {
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "IgG": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "IgM": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  }
 
},


"Glycosylated Hb (HbA1C)": {
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "Glycosylated Hb (%)": {
    unit: "%",
    reference: { adult: [4.6, 6.5] },
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
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "Toxoplasma (IgM)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Toxoplasma (IgG)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Rubella (IgM)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Rubella (IgG)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "CMV (IgM)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
 "CMV (IgG)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 1 (IgM)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 1 (IgG)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 2 (IgM)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "HSV 2 (IgG)": {
    unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  }
},

"CRP, HS CRP": {
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
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
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
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
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "Patient:prothrombin time": {
    unit: "sec",
    reference: { adult: [11, 77] },
    calculation: "Enzymatic method"
  },
  "Control:prothrombin time": {
    unit: "sec",
    reference: { adult: [] },
    calculation: "Enzymatic method"
  },
  "INR": {
    unit: "",
    reference: { adult: [0.96, 1.2] },
    calculation: "Enzymatic method"
  },
  "APTT:Patient": {
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
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "Estradoil": {
    unit: "pg/ml",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Progesterone": {
    unit: "ng/ml",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "FSH": {
    unit: "mlU/ml",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Prolactin": {
    unit: "mlU/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Testosterone": {
    unit: "ng/ml",
    reference: { adult: [1, 10.5] },
    calculation: "Enzymatic method"
  }
 
},

"Progesterone": {
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "Progesterone": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Folicular Phase": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Luteal Phase": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Post menopausal female": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Preg 1st Trimister": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Preg 2nd Trimister": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Preg 3rd Trimister": {
    unit: "nmol/L",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
  "Progesterone": {
    unit: "ng/ml",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
  },
 
 
},


"CrAg Test": {
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "CSF CrAg": {
    unit: "",
    reference: { adult: [] },
    calculation: "Enzymatic method"
  },
  "Serum CrAg": {
    unit: "sec",
    reference: { adult: [] },
    calculation: "Enzymatic method"
  },
  "Detection LATEX TITRE": {
    unit: "",
    reference: { adult: [] },
    calculation: "Enzymatic method"
  },
  "Control LATEX TITRE": {
    unit: "",
    reference: { adult: [] },
    calculation: "Enzymatic method"
  },
 
},

"Thyroid Function Test ": {
  comment: "Interpret results collectively to assess cardiovascular risk. Treatment decisions should be based on overall risk stratification, comorbidities, and guideline-based targets rather than single values.",
  "TSH": {
    unit: "mIU/L",
    reference: { adult: [0.4, 4.5] },
    calculation: "Enzymatic method"
  },
  "Free T3": {
    unit: "pmol/L",
    reference: { adult: [2, 4.2] },
    calculation: "Enzymatic method"
  },
  "Free T4": {
    unit: "pmol/L",
    reference: { adult: [12,22] },
    calculation: "Enzymatic method"
  }
},





  "Chemistry Tests": {
    "Blood Glucose (RBS)": {
      unit: "mg/dL",
      reference: { fasting: [70, 99], random: [70, 140], diabetic_target: [80, 130] },
      comment: "HIGH: hyperglycemia/diabetes; LOW: hypoglycemia. Use fasting/HbA1c for diagnosis.",
      calculation: "Glucose oxidase or hexokinase"
    },
    "Glycosylated Hb (HbA1c)": {
      unit: "%",
      reference: { adult: [4.0, 5.6] },
      comment: "≥6.5% diagnostic of diabetes; 5.7–6.4% prediabetes. Used for long-term glycemic control.",
      calculation: "HPLC or immunoassay"
    },
    "Uric Acid": {
      unit: "mg/dL",
      reference: { male: [3.4, 7.0], female: [2.4, 6.0] },
      comment: "HIGH: gout/renal impairment. LOW: rare (renal wasting or low production).",
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
      comment: "HIGH: pancreatitis (also salivary gland disease).",
      calculation: "Enzymatic"
    },
    "Lipase": {
      unit: "U/L",
      reference: { adult: [0, 160] },
      comment: "HIGH: more specific to pancreatitis than amylase.",
      calculation: "Enzymatic"
    },
    "Iron Studies": {
      Ferritin: {
        unit: "ng/mL",
        reference: { male: [30, 400], female: [15, 150] },
        comment: "LOW ferritin = iron deficiency. HIGH ferritin may indicate inflammation or iron overload.",
        calculation: "Immunoassay"
      },
      "Serum Iron": {
        unit: "µg/dL",
        reference: { adult: [60, 170] },
        comment: "Interpreted with TIBC and transferrin saturation.",
        calculation: "Colorimetric"
      },
      "TIBC": {
        unit: "µg/dL",
        reference: { adult: [250, 450] },
        comment: "HIGH in iron deficiency; LOW in chronic disease.",
        calculation: "Colorimetric"
      },
      "Transferrin Saturation": {
        unit: "%",
        reference: { adult: [20, 50] },
        comment: "LOW: iron deficiency. HIGH: iron overload.",
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
      reference: { adult: [200, 900] },
      comment: "LOW: deficiency causes macrocytic anemia/neuropathy.",
      calculation: "Immunoassay"
    },
    "Folate": {
      unit: "ng/mL",
      reference: { adult: [3, 17] },
      comment: "LOW: macrocytic anemia; risk in pregnancy if low.",
      calculation: "Immunoassay"
    },
    "Creatine (CK)": {
      unit: "U/L",
      reference: { male: [38, 174], female: [26, 140] },
      comment: "HIGH: muscle injury, rhabdomyolysis, myocardial damage if isoenzymes support.",
      calculation: "Enzymatic"
    },
    "BUN": {
      unit: "mg/dL",
      reference: { adult: [7, 20] },
      comment: "See Urea entry.",
      calculation: "Urease/converted units"
    }
   
  },
   
  "Widal Test": {
    "Salmonella paratyphi AH": {
      unit: "Titre",
      reference: "<1:80",
      comment: "≥1:160 suggests recent or active infection. Interpret with clinical findings."
    },
    "Salmonella paratyphi BH": {
      unit: "Titre",
      reference: "<1:80",
      comment: "Rising titre on repeat sample is more significant than a single value."
    },
    "Salmonella paratyphi CH": {
      unit: "Titre",
      reference: "<1:80",
      comment: "Single high titre may be nonspecific."
    },
    "Salmonella paratyphi AO": {
      unit: "Titre",
      reference: "<1:80",
      comment: "Cross-reactivity common in endemic regions."
    },
    "Salmonella paratyphi BO": {
      unit: "Titre",
      reference: "<1:80",
      comment: "Interpret alongside symptoms and culture results."
    },
    "Salmonella paratyphi CO": {
      unit: "Titre",
      reference: "<1:80",
      comment: "Background antibodies may be present."
    },
    "Salmonella typhi H": {
      unit: "Titre",
      reference: "<1:80",
      comment: "H antibody suggests past exposure or immunisation."
    },
    "Salmonella typhi O": {
      unit: "Titre",
      reference: "<1:80",
      comment: "O antibody more suggestive of acute infection."
    }
  },

  "Fluid M/C/S": {
    "Type": { unit: "", reference: "Clear", comment: "Depends on fluid source." },
    "Appearance": { unit: "", reference: "Clear", comment: "Turbid suggests infection." },
    "Clarity": { unit: "", reference: "Clear", comment: "Cloudy indicates cells or bacteria." },
    "Clot": { unit: "", reference: "Absent", comment: "Presence may indicate TB or high protein." },
    "WBC's": { unit: "cells/µL", reference: "0–5", comment: "Increased in infection." },
    "RBC's": { unit: "cells/µL", reference: "0", comment: "Presence suggests bleeding or trauma." },
    "Lymphocytes": { unit: "%", reference: "<40%", comment: "Raised in TB or viral infections." },
    "Polymorphs": { unit: "%", reference: "<60%", comment: "Raised in bacterial infection." },
    "Other WBC's": { unit: "%", reference: "None", comment: "Abnormal if present." },
    "Organisms": { unit: "", reference: "Not seen", comment: "Any organism seen is significant." },
    "Protein": { unit: "g/L", reference: "0.15–0.45", comment: "Elevated in infection/inflammation." }
  },

  "Rectal Swab M/C/S": {
    "Color": { unit: "", reference: "Brown", comment: "Abnormal colors suggest pathology." },
    "Consistency": { unit: "", reference: "Formed", comment: "Loose stools suggest diarrhea." },
    "Occult blood": { unit: "", reference: "Negative", comment: "Positive suggests GI bleeding." },
    "WBC": { unit: "/HPF", reference: "0–5", comment: "Increased in bacterial colitis." },
    "RBC": { unit: "/HPF", reference: "None", comment: "Suggests invasive disease." },
    "Mucus": { unit: "", reference: "Absent", comment: "Present in infection." },
    "Isospora belli": { unit: "", reference: "Not seen", comment: "Opportunistic parasite." },
    "Cryptosporidium": { unit: "", reference: "Not seen", comment: "Common in immunocompromised patients." },
    "Pit parasites": { unit: "", reference: "Not seen", comment: "Any seen is abnormal." }
  },

  "Urine Microscopy": {
    "Type": { unit: "", reference: "Random/MSU", comment: "Depends on collection." },
    "Color": { unit: "", reference: "Straw-yellow", comment: "Dark urine suggests dehydration." },
    "Clarity": { unit: "", reference: "Clear", comment: "Turbidity suggests infection." },
    "WBC": { unit: "/HPF", reference: "0–5", comment: "Raised in UTI." },
    "RBC": { unit: "/HPF", reference: "0–2", comment: "Raised in hematuria." },
    "Epithelial cells": { unit: "/HPF", reference: "Few", comment: "Many suggest contamination." },
    "Trichomonas Vaginalis": { unit: "", reference: "Not seen", comment: "Sexually transmitted infection." },
    "Bacteria": { unit: "", reference: "None/Few", comment: "Many indicate UTI." },
    "Scistosoma": { unit: "", reference: "Not seen", comment: "Seen in endemic areas." },
    "Casts": { unit: "/LPF", reference: "None", comment: "Presence indicates renal disease." },
    "Yeasts": { unit: "", reference: "Not seen", comment: "Candida infection if present." }
  },

  "Urine Chem": {
    "Type": { unit: "", reference: "Random/MSU", comment: "Sample dependent." },
    "Color": { unit: "", reference: "Straw-yellow", comment: "Dark urine abnormal." },
    "Clarity": { unit: "", reference: "Clear", comment: "Turbid suggests infection." },
    "Bacteria": { unit: "", reference: "Negative", comment: "Positive suggests infection." },
    "S.G": { unit: "", reference: "1.005–1.030", comment: "Reflects hydration status." },
    "P.H": { unit: "", reference: "4.5–8.0", comment: "Abnormal in metabolic disorders." },
    "Protein": { unit: "mg/dL", reference: "Negative", comment: "Positive suggests renal disease." },
    "Glucose": { unit: "mg/dL", reference: "Negative", comment: "Seen in diabetes." },
    "Ketones": { unit: "mg/dL", reference: "Negative", comment: "Seen in DKA/starvation." },
    "Urobilinogen": { unit: "EU/dL", reference: "0.2–1.0", comment: "Raised in liver disease." },
    "Bilirubin": { unit: "", reference: "Negative", comment: "Suggests hepatobiliary disease." }
  },

  "Urine Albumin Creatinine Ratio": {
    "U-Albumin": { unit: "mg/L", reference: "<30", comment: "Microalbuminuria if elevated." },
    "U-Creatine": { unit: "mmol/L", reference: "2–25", comment: "Concentration dependent." },
    "U-Albumin/Crea Ratio": { unit: "mg/g", reference: "<30", comment: "Kidney damage if elevated." }
  },

  "Urine Drug Test": {
    "Amphetamine": { unit: "", reference: "Negative", comment: "Screening test only." },
    "Barbiturate": { unit: "", reference: "Negative", comment: "Confirm positives with GC/MS." },
    "Buprenorphine": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Benzodiazepine": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Ecstacy": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Methamphetamine": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Methadone": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Opiates": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Oxycodone": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Phencyclidne": { unit: "", reference: "Negative", comment: "Detected above cutoff." },
    "Antidepressants": { unit: "", reference: "Negative", comment: "Screening only." },
    "Marijuana": { unit: "", reference: "Negative", comment: "Detected above cutoff." }
  },

  "Stool M/C/S": {
    "Color": {
      unit: "",
      reference: "Brown",
      comment: "Abnormal colors (black, red, pale) suggest pathology."
    },
    "Consistency": {
      unit: "",
      reference: "Formed",
      comment: "Loose or watery stools suggest diarrhea."
    },
    "WBC": {
      unit: "/HPF",
      reference: "0–5",
      comment: "Increased in bacterial infection."
    },
    "RBC": {
      unit: "/HPF",
      reference: "None",
      comment: "Presence suggests dysentery or invasive disease."
    },
    "Mucus": {
      unit: "",
      reference: "Absent",
      comment: "Presence indicates inflammation or infection."
    },
    "Parasites": {
      unit: "",
      reference: "Not seen",
      comment: "Any parasite seen is abnormal."
    }
  },

  "Sputum AAFBS": {
    "Appearance": {
      unit: "",
      reference: "Mucoid",
      comment: "Purulent or blood-stained sputum is abnormal."
    },
    "ZN Slide 1": {
      unit: "",
      reference: "Negative",
      comment: "Positive indicates Acid Fast Bacilli (TB)."
    },
    "ZN Slide 2": {
      unit: "",
      reference: "Negative",
      comment: "Repeat increases diagnostic sensitivity."
    },
    "ZN Slide 3": {
      unit: "",
      reference: "Negative",
      comment: "Used for confirmation."
    }
  },

  "Swab M/C/S": {
    "Gram stain": {
      unit: "",
      reference: "Normal flora",
      comment: "Pathogenic organisms should be identified."
    },
    "Bacteria": {
      unit: "",
      reference: "Normal flora / None",
      comment: "Pathogens require identification and sensitivity."
    },
    "WBC": {
      unit: "/HPF",
      reference: "0–5",
      comment: "Increased in infection."
    },
    "RBC": {
      unit: "/HPF",
      reference: "None",
      comment: "May indicate trauma or inflammation."
    },
    "Epithelial cells": {
      unit: "/HPF",
      reference: "Few",
      comment: "Many suggest contamination."
    },
    "Clue cells": {
      unit: "",
      reference: "Absent",
      comment: "Presence suggests bacterial vaginosis."
    },
    "T-Vaginalis": {
      unit: "",
      reference: "Not seen",
      comment: "Sexually transmitted infection."
    },
    "Yeasts/Buds": {
      unit: "",
      reference: "Not seen",
      comment: "Presence suggests candidiasis."
    },
    "Lactobacilli": {
      unit: "",
      reference: "Present",
      comment: "Normal vaginal flora."
    },
    "Organisms": {
      unit: "",
      reference: "None / Normal flora",
      comment: "Report and identify pathogens."
    },
    "Other": {
      unit: "",
      reference: "None",
      comment: "Specify if present."
    }
  },

"Sputum M/C/S": {
    "Epithelial cells": {
      unit: "/LPF",
      reference: "Few",
      comment: "Many indicate saliva contamination."
    },
    "Appearance": {
      unit: "",
      reference: "Mucoid",
      comment: "Purulent sputum suggests infection."
    },
    "WBC": {
      unit: "/HPF",
      reference: "Few",
      comment: "Increased in infection."
    },
    "RBC": {
      unit: "/HPF",
      reference: "None",
      comment: "Presence suggests hemoptysis."
    },
    "Organisms": {
      unit: "",
      reference: "None",
      comment: "Identify and perform sensitivity testing."
    },
    "Other": {
      unit: "",
      reference: "None",
      comment: "Specify if present."
    },
    "ZN STAIN": {
      unit: "",
      reference: "Negative",
      comment: "Screens for Acid Fast Bacilli."
    },
    "GRAM STAIN": {
      unit: "",
      reference: "Normal flora",
      comment: "Pathogens should be reported."
    },
    "ZN Slide 3": {
      unit: "",
      reference: "Negative",
      comment: "Used for confirmation if required."
    }
  },

  "Sputum for Gene Xpert": {
    "Gene Xpert": {
      unit: "",
      reference: "MTB Not Detected",
      comment: "Detects Mycobacterium tuberculosis and Rifampicin resistance."
    }
  },

  "Microbiology": {
    "Malaria Test": {
      unit: "Positive/Negative or parasites/µL (microscopy)",
      reference: { all: ["Negative"] },
      comment: "POSITIVE: active malaria; species ID important for therapy. NEGATIVE: no parasites seen; consider repeat if high suspicion.",
      calculation: "Peripheral smear microscopy (gold standard) or rapid antigen tests; PCR for confirmation"
    },
    "Urine Culture": {
      unit: "CFU/mL",
      reference: { adult: ["<10^3: no significant growth; ≥10^5 often significant; cutoffs lab-dependent"] },
      comment: "Significant growth with symptoms = UTI; identify organism and sensitivity.",
      calculation: "Culture and colony counting"
    },
    "Blood Culture": {
      unit: "Positive/Negative; organism ID",
      reference: { all: ["Negative"] },
      comment: "POSITIVE: bacteremia/fungemia—interpret contamination vs true pathogen. Time-to-positivity can help.",
      calculation: "Automated blood culture systems + ID/MALDI-TOF"
    },
    "Sputum Culture": {
      unit: "CFU/mL / organism ID",
      reference: { all: ["Depends on pathogen"] },
      comment: "Isolate pathogens to guide therapy; colonizers vs pathogens require clinical correlation.",
      calculation: "Culture with susceptibility testing"
    },
    "Stool Culture": {
      unit: "Organism ID",
      reference: { all: ["Not detected"] },
      comment: "Detection indicates enteric pathogen; interpret with symptoms & toxin tests when relevant.",
      calculation: "Selective culture and PCR panels"
    },
    "Throat Swab Culture": {
      unit: "Organism ID",
      reference: { all: ["No pathogenic growth (depends)"] },
      comment: "Growth of group A strep or other pathogens indicates treatable infection; normal flora otherwise.",
      calculation: "Culture"
    },
    "Antibiotic Sensitivity Test": {
      unit: "S/I/R (susceptible/intermediate/resistant)",
      reference: { all: ["Interpret per CLSI/EUCAST breakpoints"] },
      comment: "Guides antibiotic selection; resistance patterns critical to therapy.",
      calculation: "Disc diffusion (Kirby-Bauer) or MIC"
    },
    "Urinalysis": {
      unit: "Various (pH, protein, blood, nitrite, LE, glucose)",
      reference: { all: ["Parameter-specific; dipstick cutoffs lab dependent"] },
      comment: "Abnormal nitrite/leukocyte esterase suggests UTI; blood suggests hematuria; protein indicates kidney involvement.",
      calculation: "Dipstick + microscopic exam"
    },
    "Microscopy (direct)": {
      unit: "Qualitative",
      reference: { all: ["Absent/Present"] },
      comment: "Parasites, ova, cysts, fungal elements, helminths — presence indicates infection.",
      calculation: "Wet mount, KOH for fungi"
    },
    "KOH Prep": {
      unit: "Positive/Negative",
      reference: { all: ["Negative"] },
      comment: "POSITIVE: fungal elements; NEGATIVE: none seen.",
      calculation: "KOH microscopy"
    },
    "Fungal Culture": {
      unit: "Growth/No growth",
      reference: { all: ["No growth"] },
      comment: "Growth: identify species for therapy.",
      calculation: "Culture on selective media"
    },
    "CSF Culture": {
      unit: "Organism ID / Not detected",
      reference: { all: ["Sterile"] },
      comment: "POSITIVE: meningitis agent — urgent management; NEGATIVE does not exclude viral meningitis (use PCR).",
      calculation: "Culture/Gram stain/PCR"
    }
  },

  "TB Tests": {
    "PCR TB": {
      unit: "Detected/Not detected (Ct optional)",
      reference: { all: ["Not detected"] },
      comment: "DETECTED: MTB DNA present — rapid evidence of infection, sensitivity depends on specimen. NOT DETECTED: may not rule out TB particularly in paucibacillary disease.",
      calculation: "NAAT/PCR"
    },
    "Tuberculosis GeneXpert": {
      unit: "Detected/Not detected; RIF resistance flagged",
      reference: { all: ["Not detected"] },
      comment: "DETECTED: MTB complex; specific rifampicin resistance flagged — helpful for rapid treatment decisions.",
      calculation: "Xpert MTB/RIF cartridge (RT-PCR)"
    },
    "Mantoux Test (TST)": {
      unit: "mm induration",
      reference: { all: { thresholds: "5/10/15 mm depending on risk group" } },
      comment: "Positive induration suggests latent or active TB exposure — interpret with BCG history and risk factors.",
      calculation: "Intradermal PPD, read 48–72 hours"
    },
    "TB Culture": {
      unit: "Growth / organism ID",
      reference: { all: ["No growth (sterile)"] },
      comment: "Culture confirms TB and allows susceptibility testing (slow but gold standard).",
      calculation: "Solid/liquid mycobacterial media"
    },
    "AFB Smear": {
      unit: "Acid-fast bacilli seen/not seen",
      reference: { all: ["Not seen"] },
      comment: "AFB POSITIVE: high suspicion for mycobacterial infection; low sensitivity for paucibacillary disease.",
      calculation: "Ziehl-Neelsen or fluorescent staining"
    }
  },

  "Hepatitis A": {
    "Hepatitis A IgM": {
      unit: "",
      reference: "Negative",
      comment: "Positive indicates acute or recent Hepatitis A infection."
    },
    "Hepatitis A IgG": {
      unit: "",
      reference: "Negative",
      comment: "Positive indicates past infection or immunity (vaccination)."
    }
  },

  "Hepatitis B": {
    "HBsAg": {
      unit: "",
      reference: "Negative",
      comment: "Positive indicates active Hepatitis B infection."
    },
    "HBsAb": {
      unit: "mIU/mL",
      reference: ">10",
      comment: "Protective immunity due to vaccination or recovery."
    },
    "HBeAg": {
      unit: "",
      reference: "Negative",
      comment: "Positive indicates active viral replication and high infectivity."
    },
    "HBeAb": {
      unit: "",
      reference: "Negative",
      comment: "Positive suggests reduced viral replication."
    },
    "HBcAb": {
      unit: "",
      reference: "Negative",
      comment: "Indicates previous or ongoing infection (not from vaccination)."}
    },

    "HPV Tests": {
    "HPV 16": {
      unit: "Detected/Not Detected",
      reference: { all: ["Not Detected"] },
      comment: "DETECTED: high-risk HPV 16 — higher risk for cervical cancer; follow local screening/colposcopy guidelines.",
      calculation: "PCR-based genotyping"
    },
    "HPV 18": {
      unit: "Detected/Not Detected",
      reference: { all: ["Not Detected"] },
      comment: "DETECTED: high-risk HPV 18 — risk for cervical/other cancers.",
      calculation: "PCR genotyping"
    },
    "HPV 31": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV — follow screening guidance.", calculation: "PCR" },
    "HPV 33": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 35": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 39": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 45": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 51": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 52": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 56": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 58": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 59": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 66": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV; lower oncogenic risk than 16/18.", calculation: "PCR" },
    "HPV 68": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
 
    "HPV 6": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (genital warts), not strongly oncogenic.", calculation: "PCR" },
    "HPV 11": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (warts).", calculation: "PCR" },
    "HPV 40": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 42": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 43": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 44": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 54": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 61": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 70": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 72": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 81": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" }
  },

  "HPV HR PCR Tests": {
    "HPV 16": {
      unit: "Detected/Not Detected",
      reference: { all: ["Not Detected"] },
      comment: "DETECTED: high-risk HPV 16 — higher risk for cervical cancer; follow local screening/colposcopy guidelines.",
      calculation: "PCR-based genotyping"
    },
    "HPV 18": {
      unit: "Detected/Not Detected",
      reference: { all: ["Not Detected"] },
      comment: "DETECTED: high-risk HPV 18 — risk for cervical/other cancers.",
      calculation: "PCR genotyping"
    },
    "HPV 31": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV — follow screening guidance.", calculation: "PCR" },
    "HPV 33": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 35": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 39": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 45": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 51": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 52": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 56": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 58": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 59": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" },
    "HPV 66": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV; lower oncogenic risk than 16/18.", calculation: "PCR" },
    "HPV 68": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "High-risk HPV.", calculation: "PCR" }
  },

  "Viral Load": {
    "HIV RNA (Viral Load)": {
      unit: "copies/mL",
      reference: "<50",
      comment: "Undetectable viral load (<50 copies/mL) indicates effective antiretroviral therapy. Detectable or rising levels suggest poor adherence, treatment failure, or resistance. Interpret alongside CD4 count and clinical status."
    }
  },

  "HPV LR PCR Tests": {
    "HPV 6": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (genital warts), not strongly oncogenic.", calculation: "PCR" },
    "HPV 11": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV (warts).", calculation: "PCR" },
    "HPV 40": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 42": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 43": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 44": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 54": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 61": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 70": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 72": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" },
    "HPV 81": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Low-risk HPV.", calculation: "PCR" }
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
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT/PCR" 
  },
  "Chlamydia trachomatis": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Treponema pallidum": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "PCR" 
  },
  "Trichomonas vaginalis": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT or microscopy" 
  },
  "Ureaplasma urealyticum": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Ureaplasma parvum": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Mycoplasma genitalium": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Mycoplasma hominis": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT or culture" 
  },
  "HSV 1": { 
    unit: "Detected/Not Detected (PCR) or IgG/IgM)", 
    reference: { all: ["Not Detected"] }, 
    calculation: "PCR/Serology" 
  },
  "HSV 2": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "PCR/Serology" 
  },
  "Candida Albicans": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "Culture/NAAT" 
  },
  "Gardnerella vaginalis": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT/culture" 
  }
},

"STI 6PCR Panel": {
  comment: "Interpret results collectively. DETECTED indicates potential infection requiring appropriate clinical management or treatment; NOT DETECTED suggests no NAAT/PCR evidence of infection. Always consider clinical context and symptoms.",
  "Neisseria gonorrhoeae": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT/PCR" 
  },
  "Chlamydia trachomatis": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Treponema pallidum": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "PCR" 
  },
 
  "Ureaplasma urealyticum": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
 
  "Mycoplasma genitalium": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT" 
  },
  "Mycoplasma hominis": { 
    unit: "Detected/Not Detected", 
    reference: { all: ["Not Detected"] }, 
    calculation: "NAAT or culture" 
  }
},

  "Molecular Tests": {
    "DNA Extraction (yield)": {
      unit: "ng/µL",
      reference: { all: ["Lab QC thresholds; e.g., >10 ng/µL for many NGS workflows"] },
      comment: "LOW yield may cause assay failure; purity (A260/280 ~1.8) important.",
      calculation: "Spectrophotometry (A260) or fluorometry (Qubit)"
    },
    "BRCA 1/2 Mutation Analysis": {
      unit: "Report: classification (Pathogenic/Likely Pathogenic/VUS/Benign)",
      reference: { all: ["No pathogenic variant (wild-type) or classified variant"] },
      comment: "PATHOGENIC: increased hereditary breast/ovarian cancer risk; VUS: uncertain significance — manage per guidelines.",
      calculation: "NGS panel with confirmatory Sanger when needed"
    },
    "HIV Viral Load": {
      unit: "copies/mL",
      reference: { all: ["Undetectable (< assay LOD e.g., <20-50 copies/mL)"] },
      comment: "Detectable: active replication; Undetectable indicates effective therapy (assay-specific).",
      calculation: "qPCR"
    },
    "Hepatitis B Viral Load": {
      unit: "IU/mL",
      reference: { all: ["Undetectable or assay-specific LLOQ"] },
      comment: "Detectable: active replication — quantify for treatment decisions.",
      calculation: "qPCR"
    },
    "Hepatitis C Viral Load": {
      unit: "IU/mL",
      reference: { all: ["Undetectable or assay-specific LLOQ"] },
      comment: "Used to assess active infection and SVR after therapy.",
      calculation: "qPCR"
    },
    "COVID-19 PCR": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: SARS-CoV-2 RNA present; Ct values semi-quantitative; correlate with clinical picture.", calculation: "RT-PCR" },
    "Influenza PCR": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: influenza virus; directs antiviral therapy.", calculation: "RT-PCR" },
    "RSV PCR": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: RSV infection (important in infants/elderly).", calculation: "RT-PCR" },
    "HBV Genotyping": { unit: "Genotype (A,B,C...)", reference: { all: ["N/A"] }, comment: "Genotype influences disease course and therapy choices in some contexts.", calculation: "Sequencing/line probe assays" },
    "HCV Genotyping": { unit: "Genotype", reference: { all: ["N/A"] }, comment: "Genotype informs treatment selection (historically).", calculation: "Sequencing/line probe"
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





