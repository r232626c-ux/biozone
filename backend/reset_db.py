import asyncio
from passlib.hash import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session, engine, Base
from app.models import User, LabTest

# Flattened list of all default lab tests
DEFAULT_LAB_TESTS = {
    "Tumor Markers": [
        "PSA", "CA-125", "CEA", "AFP", "CA 19-9", "CA 15-3", "CA 72-4",
        "Thyroglobulin", "Calcitonin", "Beta-2 Microglobulin",
        "NSE", "CYFRA 21-1", "LDH", "HE4"
    ],
    "Serology": [
        "HIV test", "BhCG", "Widal", "HbsAg", "HSV", "Syphilis", "H.pylori",
        "CRP", "RF", "TORCH", "ANA", "Allergy", "Urine Drug Test",
        "Hepatitis A IgM", "Hepatitis C Antibody", "Rubella", "Measles IgG/IgM",
        "Varicella-Zoster IgG/IgM", "COVID-19 IgG/IgM", "Dengue NS1 IgM/IgG",
        "Zika IgM", "Yellow Fever Antibody"
    ],
    "Hematology / Full Blood Count (FBC)": [
        "WBC", "Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils",
        "Basophils", "RBC", "Hemoglobin", "Hematocrit", "MCV", "MCH", "MCHC",
        "RDW", "Platelets", "MPV", "PDW", "Reticulocyte Count", "Peripheral Blood Smear",
        "ESR", "INR", "D-Dimer"
    ],
    "Chemistry Tests": [
        "Blood Glucose (RBS)", "Uric Acid", "Total Cholesterol",
        "HDL Cholesterol", "LDL Cholesterol", "VLDL Cholesterol",
        "Triglycerides", "Urea", "ALT", "AST", "LFT", "GGT",
        "Total Bilirubin", "Sodium", "Potassium", "Bicarbonate",
        "Calcium", "Magnesium", "Glycosylated Hb", "Creatine",
        "Creatinine", "BUN", "Albumin", "Total Protein", "Amylase", "Lipase",
        "Iron Studies", "Ferritin", "Transferrin", "Vitamin B12", "Folate"
    ],
    "Microbiology": [
        "Malaria Test", "Urine Culture", "Blood Culture", "Sputum Culture",
        "Stool Culture", "Throat Swab Culture", "Antibiotic Sensitivity Test",
        "Urinalysis", "Microscopy", "KOH Prep", "Fungal Culture",
        "CSF Culture"
    ],
    "TB Tests": [
        "PCR TB", "Tuberculosis GeneXpert", "Mantoux Test", "TB Culture", "AFB Smear"
    ],
    "HPV Tests": [
        "HPV 16", "HPV 18", "HPV 31", "HPV 33", "HPV 35", "HPV 39", "HPV 45",
        "HPV 51", "HPV 52", "HPV 56", "HPV 58", "HPV 59", "HPV 66", "HPV 68",
        "HPV 6", "HPV 11", "HPV 40", "HPV 42", "HPV 43", "HPV 44", "HPV 54",
        "HPV 61", "HPV 70", "HPV 72", "HPV 81"
    ],
    "STI Molecular Panel": [
        "Neisseria gonorrhoeae", "Chlamydia trachomatis", "Treponema pallidum",
        "Trichomonas vaginalis", "Ureaplasma urealyticum", "Ureaplasma parvum",
        "Mycoplasma genitalium", "Mycoplasma hominis", "HSV 1", "HSV 2",
        "Candida Albicans", "Gardnerella vaginalis"
    ],
    "Molecular Tests": [
        "DNA Extraction", "BRCA 1/2 Mutation Analysis", "HIV Viral Load",
        "Hepatitis B Viral Load", "Hepatitis C Viral Load",
        "COVID-19 PCR", "Influenza PCR", "RSV PCR", "HBV Genotyping",
        "HCV Genotyping"
    ],
    "NGS (Next-Generation Sequencing)": [
        "Whole Genome Sequencing", "Whole Exome Sequencing",
        "RNA Sequencing", "Cancer Gene Panel", "Hereditary Cancer Panel",
        "Pharmacogenomics Panel", "Mitochondrial Genome Sequencing",
        "Microbiome Sequencing", "BRCA NGS", "HLA Typing NGS"
    ],
    "Prenatal / Pregnancy": [
        "NIPT (Non-Invasive Prenatal Test)", "BhCG Quantitative",
        "Fetal DNA Screening", "Maternal Serum Screening",
        "Amniocentesis Genetic Panel", "Quad Screening"
    ],
    "Paternity & Forensics": [
        "Standard Paternity Test", "Extended Family Test", "Forensic DNA Profiling",
        "Ancestry DNA Testing", "Y-STR Profiling", "mtDNA Profiling"
    ],
    "Allergy Tests": [
        "Food Allergy Panel", "Environmental Allergy Panel",
        "Drug Allergy Panel", "Egg Allergy", "Milk Allergy",
        "Fish Allergy", "Nuts Allergy", "Pollen Allergy", "Dust Mite Allergy",
        "Protia Allergy Test"
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
        "Meningitis PCR Panel", "Sepsis PCR Panel",
        "Zoonotic Diseases Panel"
    ]
}

async def init_lab_tests(db: AsyncSession):
    result = await db.execute(select(LabTest))
    if result.scalars().first():
        return

    for category, tests in DEFAULT_LAB_TESTS.items():
        for test_name in tests:
            db.add(LabTest(category=category, name=test_name))
    await db.commit()

async def reset_and_init():
    # Drop and recreate all tables
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)

  
    # Initialize lab tests
    async with async_session() as db:
        print("Initializing lab tests...")
        await init_lab_tests(db)

    print("✅ Database reset and initialization complete.")

if __name__ == "__main__":
    asyncio.run(reset_and_init())
