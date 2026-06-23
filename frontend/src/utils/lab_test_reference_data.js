// lab_test_reference_data.js
const lab_reference = {
  "Tumor Markers": {
    "PSA": {
      unit: "ng/mL",
      reference: { male: { "<50": [0, 2.5], "50-59": [0, 3.5], "60-69": [0, 4.5], "70+": [0, 6.5] } },
      comment:
        "HIGH: suggests prostate disease (BPH, prostatitis) or prostate cancer; HIGHER risk with values > age-specific upper limit. LOW: within expected. Trend/velocity matters. POSITIVE/NEGATIVE not applicable.",
      calculation: "Immunoassay (total PSA). Use age-specific cutoffs; consider free/total ratio for better specificity."
    },
    "CA-125": {
      unit: "U/mL",
      reference: { female: { all: [0, 35] } },
      comment: "HIGH: ovarian malignancy suspicion, but can be high with menstruation, endometriosis, inflammation. LOW: normal. Best for trend monitoring post-diagnosis.",
      calculation: "Immunoassay/ELISA"
    },
    "CEA": {
      unit: "ng/mL",
      reference: { adult: [0, 3] },
      comment: "HIGH: colorectal and other adenocarcinomas; smoking elevates baseline. LOW: normal. Monitor trends for recurrence.",
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
      reference: { adult: [0, 30] },
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
      comment: "HIGH after thyroidectomy may indicate residual/recurrent thyroid cancer; interpret with anti-thyroglobulin antibodies.",
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
      comment: "HIGH: renal dysfunction, hematologic malignancies; LOW: typical.",
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
      comment: "HIGH: nonspecific marker of tissue damage, hemolysis, tumor burden; LOW: rare clinically.",
      calculation: "Enzymatic assay"
    },
    "HE4": {
      unit: "pmol/L",
      reference: { female: { all: [0, 70] } },
      comment: "HIGH: ovarian cancer marker (used with CA-125 & algorithms like ROMA).",
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
    "H.pylori": {
      unit: "Reactive/Non-reactive (or IgG titer)",
      reference: { all: ["Non-reactive"] },
      comment: "POSITIVE: exposure or active infection depending on test (stool antigen / urea breath indicate active infection; IgG may persist after eradication).",
      calculation: "Stool antigen, urea breath test, or serology"
    },
    "CRP": {
      unit: "mg/L",
      reference: { adult: [0, 5] },
      comment: "HIGH: acute inflammation/infection. CRP 10–40 mg/L often viral/mild inflammation; >40 mg/L suggests bacterial/severe inflammation.",
      calculation: "Immunoturbidimetry"
    },
    "RF": {
      unit: "IU/mL",
      reference: { adult: [0, 14] },
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

  "Hematology / Full Blood Count (FBC)": {
    "WBC": {
      unit: "10^9/L",
      reference: { adult: [4, 11], child: [5, 15] },
      comment: "HIGH: infection, inflammation, stress, leukemia. LOW: bone marrow suppression, severe infection, some drugs.",
      calculation: "Automated hematology analyzer"
    },
    "Neutrophils": {
      unit: "10^9/L (or %)",
      reference: { adult: { abs: [2.0, 7.5], percent: [40, 70] } },
      comment: "NEUTROPHILIA: bacterial infection/inflammation. NEUTROPENIA: increased infection risk (drug, marrow failure, viral).",
      calculation: "CBC differential"
    },
    "Lymphocytes": {
      unit: "10^9/L (or %)",
      reference: { adult: { abs: [1.0, 3.0], percent: [20, 50] }, child: { percent: [35, 60] } },
      comment: "LYMPHOCYTOSIS: viral infection/lymphoproliferative disorder. LYMPHOPENIA: immunodeficiency or steroid effect.",
      calculation: "CBC differential"
    },
    "Monocytes": {
      unit: "10^9/L (or %)",
      reference: { adult: { abs: [0.2, 0.8], percent: [2, 8] } },
      comment: "MONOCYTOSIS: chronic infection/inflammation. Low: usually less clinically significant.",
      calculation: "CBC differential"
    },
    "Eosinophils": {
      unit: "10^9/L (or %)",
      reference: { adult: { abs: [0.0, 0.5], percent: [1, 6] } },
      comment: "EOSINOPHILIA: allergies, parasitic infection, some drug reactions.",
      calculation: "CBC differential"
    },
    "Basophils": {
      unit: "10^9/L (or %)",
      reference: { adult: { abs: [0.0, 0.1], percent: [0, 1] } },
      comment: "BASOPHILIA uncommon; seen in some myeloproliferative disorders/allergy.",
      calculation: "CBC differential"
    },
    "RBC": {
      unit: "10^12/L",
      reference: { male: [4.5, 6.0], female: [4.0, 5.5], child: [4.0, 5.5] },
      comment: "HIGH: polycythemia or hemoconcentration. LOW: anemia — interpret with Hgb/Hct indices.",
      calculation: "CBC analyzer"
    },
    "Hemoglobin": {
      unit: "g/dL",
      reference: { male: [13.5, 17.5], female: [12, 16], child: [11, 16] },
      comment: "LOW: anemia (iron deficiency, chronic disease, hemolysis). HIGH: dehydration or polycythemia.",
      calculation: "CBC analyzer"
    },
    "Hematocrit": {
      unit: "%",
      reference: { male: [41, 53], female: [36, 46] },
      comment: "LOW: anemia. HIGH: dehydration/polycythemia.",
      calculation: "Calculated from RBC and MCV"
    },
    "MCV": {
      unit: "fL",
      reference: { adult: [80, 100] },
      comment: "LOW: microcytic anemia (iron deficiency). HIGH: macrocytic anemia (B12/folate deficiency, alcohol).",
      calculation: "MCV = Hct (%) * 10 / RBC (10^12/L)"
    },
    "MCH": {
      unit: "pg",
      reference: { adult: [27, 33] },
      comment: "Assists in anemia classification; LOW in microcytic anemia.",
      calculation: "MCH = Hgb (g/dL) * 10 / RBC (10^12/L)"
    },
    "MCHC": {
      unit: "g/dL",
      reference: { adult: [32, 36] },
      comment: "LOW: hypochromic anemia. HIGH: spherocytosis or artifact.",
      calculation: "MCHC = Hgb (g/dL) / Hct (%) * 100"
    },
    "RDW": {
      unit: "%",
      reference: { adult: [11.5, 14.5] },
      comment: "HIGH: anisocytosis — early iron deficiency or mixed deficiencies.",
      calculation: "Analyzer-calculated"
    },
    "Platelets": {
      unit: "10^9/L",
      reference: { adult: [150, 450] },
      comment: "THROMBOCYTOPENIA: bleeding risk. THROMBOCYTOSIS: reactive/inflammatory or myeloproliferative disease.",
      calculation: "CBC analyzer"
    },
    "MPV": {
      unit: "fL",
      reference: { adult: [7.5, 11.5] },
      comment: "HIGH: larger/younger platelets (increased production). LOW: production problem.",
      calculation: "Analyzer"
    },
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
      reference: { adult: [0.9, 1.2] },
      comment: "HIGH: anticoagulation effect or clotting factor deficiency; monitor warfarin therapy.",
      calculation: "Derived from PT"
    },
    "D-Dimer": {
      unit: "ng/mL FEU",
      reference: { adult: ["<500 (age-adjusted recommended; e.g., age*10 for >50)"] },
      comment: "HIGH: possible clot breakdown (DVT/PE) but nonspecific (inflammation, malignancy). Normal helps rule-out PE in low-risk patients.",
      calculation: "Immunoassay"
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
    "Total Cholesterol": {
      unit: "mg/dL",
      reference: { adult: [0, 200] },
      comment: "HIGH: increased cardiovascular risk; interpret with LDL/HDL/TG and risk calculators.",
      calculation: "Enzymatic method"
    },
    "HDL Cholesterol": {
      unit: "mg/dL",
      reference: { adult: [40, 60] },
      comment: "LOW HDL: higher CV risk. HIGH HDL usually protective but very high values need clinical context.",
      calculation: "Direct enzymatic assay"
    },
    "LDL Cholesterol": {
      unit: "mg/dL",
      reference: { adult: [0, 100] },
      comment: "HIGH LDL: primary target for CV risk reduction. Use risk-based thresholds for treatment.",
      calculation: "Direct assay or Friedewald: LDL = TC - HDL - (TG/5) (useful if TG <400 mg/dL)"
    },
    "VLDL Cholesterol": {
      unit: "mg/dL",
      reference: { adult: [5, 40] },
      comment: "Correlates with triglycerides; elevated in hypertriglyceridemia.",
      calculation: "VLDL ≈ TG/5 (approx)"
    },
    "Triglycerides": {
      unit: "mg/dL",
      reference: { adult: [0, 149] },
      comment: "HIGH: metabolic syndrome, pancreatitis risk when very high (>500).",
      calculation: "Enzymatic assay"
    },
    "Urea (BUN equivalent)": {
      unit: "mg/dL",
      reference: { adult: [7, 20] },
      comment: "HIGH: renal impairment, dehydration. LOW: malnutrition, liver disease.",
      calculation: "Urease method"
    },
    "Creatinine": {
      unit: "mg/dL",
      reference: { male: [0.7, 1.3], female: [0.6, 1.1] },
      comment: "HIGH: reduced kidney function. LOW: low muscle mass. Use eGFR for staging.",
      calculation: "Jaffe or enzymatic assays"
    },
    "eGFR": {
      unit: "mL/min/1.73m2",
      reference: { adult: [">90 normal"] },
      comment: "Decreased eGFR indicates CKD stage; calculate with CKD-EPI or MDRD formula (age, sex, creatinine, race considerations depending on equation).",
      calculation: "CKD-EPI or MDRD equations"
    },
    "ALT (SGPT)": {
      unit: "U/L",
      reference: { adult: [7, 56] },
      comment: "HIGH: hepatocellular injury (viral, drugs, alcohol).",
      calculation: "Enzymatic assay"
    },
    "AST (SGOT)": {
      unit: "U/L",
      reference: { adult: [10, 40] },
      comment: "HIGH: liver or muscle injury; AST:ALT ratio can help differentiate causes.",
      calculation: "Enzymatic assay"
    },
    "GGT": {
      unit: "U/L",
      reference: { adult: [9, 48] },
      comment: "HIGH: cholestasis, alcohol use, liver injury.",
      calculation: "Enzymatic assay"
    },
    "Total Bilirubin": {
      unit: "mg/dL",
      reference: { adult: [0.1, 1.2] },
      comment: "HIGH: hemolysis, hepatic impairment or obstructive jaundice depending on conjugated fraction.",
      calculation: "Diazo method or enzymatic"
    },
    "Sodium": {
      unit: "mmol/L",
      reference: { adult: [135, 145] },
      comment: "HYponatremia/HYPERnatremia: fluid balance, endocrine or renal disorders; interpret clinically.",
      calculation: "Ion-selective electrode"
    },
    "Potassium": {
      unit: "mmol/L",
      reference: { adult: [3.5, 5.1] },
      comment: "HYPO/HYPERkalemia: cardiac risk; investigate causes (renal, drugs, endocrine).",
      calculation: "Ion-selective electrode"
    },
    "Bicarbonate (HCO3-)": {
      unit: "mmol/L",
      reference: { adult: [22, 28] },
      comment: "LOW: metabolic acidosis. HIGH: metabolic alkalosis.",
      calculation: "Chemistry analyzer or blood gas"
    },
    "Calcium (total)": {
      unit: "mg/dL",
      reference: { adult: [8.6, 10.2] },
      comment: "HIGH: hyperparathyroidism, malignancy. LOW: hypoparathyroidism, vitamin D deficiency. Consider albumin correction or ionized Ca.",
      calculation: "Corrected Ca = measured Ca + 0.8*(4.0 - albumin g/dL) when albumin low"
    },
    "Magnesium": {
      unit: "mg/dL",
      reference: { adult: [1.7, 2.2] },
      comment: "Abnormal: neuromuscular/arrhythmia risk.",
      calculation: "Colorimetric"
    },
    "Total Protein": {
      unit: "g/dL",
      reference: { adult: [6.0, 8.3] },
      comment: "LOW: malnutrition, liver disease. HIGH: chronic inflammation, monoclonal gammopathy.",
      calculation: "Biuret"
    },
    "Albumin": {
      unit: "g/dL",
      reference: { adult: [3.5, 5.0] },
      comment: "LOW: liver disease, nephrotic syndrome, malnutrition.",
      calculation: "Bromocresol green or purple"
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
    },
    "Anion Gap": {
      unit: "mmol/L",
      reference: { adult: [8, 12] },
      comment: "Elevated: metabolic acidosis with accumulation of unmeasured anions (DKA, renal failure, toxins).",
      calculation: "AG = Na - (Cl + HCO3). Use albumin correction if hypoalbuminemic."
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

  "HPV Tests - High Risk": {
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

  "HPV Tests - Low Risk": {
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

  "STI Molecular Panel": {
    "Neisseria gonorrhoeae": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: treat per guidelines; NEGATIVE: no NAAT detection.", calculation: "NAAT/PCR" },
    "Chlamydia trachomatis": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Often asymptomatic — test and treat if positive.", calculation: "NAAT" },
    "Treponema pallidum": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Molecular detection supports active infection; serology commonly used.", calculation: "PCR" },
    "Trichomonas vaginalis": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: trichomoniasis — treat; NEGATIVE: no NAAT detection.", calculation: "NAAT or microscopy" },
    "Ureaplasma urealyticum": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "May be commensal or pathogenic depending on symptoms.", calculation: "NAAT" },
    "Ureaplasma parvum": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Same as above.", calculation: "NAAT" },
    "Mycoplasma genitalium": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: treat per resistance-guided therapy; testing recommended for persistent urethritis/cervicitis.", calculation: "NAAT" },
    "Mycoplasma hominis": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Often commensal; interpret with symptoms.", calculation: "NAAT or culture" },
    "HSV 1": { unit: "Detected/Not Detected (PCR) or IgG/IgM)", reference: { all: ["Not Detected"] }, comment: "PCR from lesion best for acute infection.", calculation: "PCR/Serology" },
    "HSV 2": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Genital herpes agent — PCR preferred for lesions.", calculation: "PCR/Serology" },
    "Candida Albicans": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "DETECTED: candidiasis (vaginal/oral) depending on symptoms.", calculation: "Culture/NAAT" },
    "Gardnerella vaginalis": { unit: "Detected/Not Detected", reference: { all: ["Not Detected"] }, comment: "Associated with bacterial vaginosis; interpret with microscopy/clinical criteria.", calculation: "NAAT/culture"
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

export default lab_reference;
