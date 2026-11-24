# app/main.py
import os
import calendar
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

from app import models
from sqlalchemy import and_, inspect, or_, text
from fastapi import Request
from sqlalchemy import select
from typing import List
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload
from passlib.context import CryptContext
import app.schemas as schemas
from datetime import datetime, timedelta, timezone
import logging
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, JSON, ForeignKey, DateTime
from jose import jwt
import requests
from app.schemas import LabTestOut
from app import crud
from app.database import async_session, init_db, get_db, engine
from app.crud import (
    create_user, authenticate_user, create_patient, get_patient, update_patient,
    create_lab_test, get_lab_test, create_lab_request, get_lab_request,
    create_lab_result,create_password_reset_token,
    verify_password_reset_token,
    reset_user_password, get_audit_logs
   
)
from app.schemas import (
    UserCreate, PatientCreate, PatientUpdate, LabTestCreate, 
    LabRequestCreate, LabResultCreate,  UserOut, PatientOut, LabRequestOut, PasswordResetRequest,
    PasswordResetConfirm,
    PasswordChangeRequest,
    AdminCreateUser, AuditLogOut, EmailSentAuditEvent, LabRequestUpdate

)
from app.models import User, LabTest, Patient, SystemSettings, PaymentCode, LabRequest, LabResult # Ensure you have models defined




# ==============================
# CONFIG
# ==============================
SECRET_KEY = "SUPERSECRETKEY"  # Change for production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUBSCRIPTION_EXEMPT_PATHS = {
    ("GET", "/health"),
    ("POST", "/token"),
    ("POST", "/auth/change-password"),
    ("POST", "/auth/password-reset"),
    ("POST", "/auth/password-reset/confirm"),
    ("GET", "/system-settings"),
    ("POST", "/system-settings/verify-payment"),
}


def get_subscription_status(last_payment: datetime | None, now: datetime | None = None):
    current_time = now or datetime.utcnow()
    if current_time.tzinfo is not None:
        current_time = current_time.astimezone(timezone.utc).replace(tzinfo=None)
    if last_payment is None:
        return {
            "expires_at": None,
            "days_remaining": 0,
            "expired": True,
        }
    if last_payment.tzinfo is not None:
        last_payment = last_payment.astimezone(timezone.utc).replace(tzinfo=None)

    month_end = calendar.monthrange(last_payment.year, last_payment.month)[1]
    expires_at = datetime(
        last_payment.year,
        last_payment.month,
        month_end,
        23,
        59,
        59,
        999999,
    )
    return {
        "expires_at": expires_at,
        "days_remaining": max((expires_at.date() - current_time.date()).days, 0),
        "expired": current_time > expires_at,
    }


async def require_active_subscription(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    path = request.url.path.rstrip("/") or "/"
    if (
        request.method == "OPTIONS"
        or (request.method, path) in SUBSCRIPTION_EXEMPT_PATHS
        or (
            request.method == "GET"
            and (
                path == "/"
                or path.startswith("/dashboard/")
                or path.startswith("/assets/")
            )
        )
    ):
        return

    result = await db.execute(
        select(SystemSettings).order_by(SystemSettings.id).limit(1)
    )
    settings = result.scalar_one_or_none()
    subscription = get_subscription_status(
        settings.lastpaymentdate if settings else None
    )
    if subscription["expired"]:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "SUBSCRIPTION_REQUIRED",
                "message": "Subscription expired. Verify renewal to continue using Biozone.",
                "subscriptionExpiresAt": (
                    subscription["expires_at"].isoformat()
                    if subscription["expires_at"]
                    else None
                ),
            },
        )


app = FastAPI(
    title="Biozone Lab API",
    dependencies=[Depends(require_active_subscription)],
)
logger = logging.getLogger(__name__)

# CORS - include local defaults and optional deployed frontend origins.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.114:5173",
    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "https://192.168.1.114:5173",
]

frontend_origins_env = os.getenv("FRONTEND_ORIGINS", "")
if frontend_origins_env.strip():
    deployed_origins = [origin.strip().rstrip("/") for origin in frontend_origins_env.split(",") if origin.strip()]
    origins = list(dict.fromkeys(origins + deployed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(?:localhost|127\.0\.0\.1|192\.168\.1\.\d{1,3})(?::\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint - MUST come after CORS middleware
@app.get("/health")
async def health_check():
    """Simple health check endpoint to verify backend is running"""
    return {
        "status": "ok",
        "message": "Backend is running and CORS is configured correctly",
        "timestamp": datetime.now().isoformat()
    }

# ==============================
# LAB REFERENCE RANGES
# ==============================
lab_reference_ranges = {
    "CD4": {"range": "410 - 1590", "unit": "cells/µl", "comment": "Normal CD4 range for healthy immune function."},
    "ESR": {"range": "1 - 25", "unit": "mm/hr", "comment": "Elevated ESR can indicate inflammation."},
    "WBC": {"range": "4 - 10", "unit": "10⁹/L", "comment": "High WBC suggests infection or inflammation."},
    "Neutrophil(%)": {"range": "40 - 75", "unit": "%", "comment": "Neutrophils are first responders to microbial infection."},
    "Lymphocytes(%)": {"range": "25 - 40", "unit": "%", "comment": "Lymphocytes defend against viral infections."},
    "Granulocyte(%)": {"range": "2 - 10", "unit": "%", "comment": "Part of WBC count, elevated in allergic reactions and infections."},
    "Neutrophils": {"range": "1.5 - 7.5", "unit": "x10⁹/µL", "comment": "Increased in bacterial infections, decreased in certain viral infections."},
    "Lymphocytes": {"range": "1 - 4", "unit": "x10⁹/µL", "comment": "Can increase in viral infections and lymphocytic leukemia."},
    "Granulocyte": {"range": "0.2 - 1", "unit": "x10⁹/µL", "comment": "Helps indicate inflammation or allergy."},
    "HS CRP": {"range": "0.5 - 10", "unit": "mg/L", "comment": "High-sensitivity CRP indicates cardiovascular risk."},
    "Blood Glucose": {"range": "3.3 - 7.8", "unit": "mmol/L", "comment": "Used to monitor diabetes or hypoglycemia."},
    "Calcium": {"range": "2.1 - 2.55", "unit": "mmol/L", "comment": "Low calcium may indicate parathyroid disorder or vitamin D deficiency."},
    "Corrected Calcium": {"range": "2.1 - 2.55", "unit": "mmol/L", "comment": "Adjusted for albumin levels."},
    "Myoglobin": {"range": "0 - 65", "unit": "ng/ml", "comment": "Elevated in muscle injury, including myocardial infarction."},
    "Glycosylated Hb (%)": {"range": "4.8 - 6.5", "unit": "%", "comment": "Used to assess long-term glucose control."},
    "Estimated Average Glucose": {"range": "", "unit": "mmol/L", "comment": "Calculated from HbA1c levels to estimate average blood sugar."},
    "ALT": {"range": "7 - 56", "unit": "U/L", "comment": "Marker for liver function and damage."},
    "Globulin": {"range": "25 - 30", "unit": "g/L", "comment": "Elevated levels may indicate chronic inflammation."},
    "TOTAL CHOLESTEROL": {"range": "0 - 5.2", "unit": "mmol/L", "comment": "High levels associated with cardiovascular risk."},
    "LDL CHOLESTEROL": {"range": "0 - 3.1", "unit": "mmol/L", "comment": "\"Bad\" cholesterol, high levels increase risk of heart disease."},
    "VLDL CHOLESTEROL": {"range": "0 - 0.6", "unit": "mmol/L", "comment": "Associated with triglyceride levels and heart disease."},
    "NON-HDL CHOLESTEROL": {"range": "< 3.8", "unit": "mmol/L", "comment": "Better predictor of cardiovascular risk than LDL alone."},
    "TOTAL CHOL/ HDL RATIO": {"range": "< 4.1", "unit": "", "comment": "Lower ratios are generally better."},
    "RBS": {"range": "3.3 - 7.8", "unit": "mmol/L", "comment": "Random Blood Sugar; elevated in diabetes."},
    "Sodium": {"range": "135 - 147", "unit": "mmol/L", "comment": "Essential for fluid balance and nerve function."},
    "Anion-Gap": {"range": "8 - 17", "unit": "mmol/L", "comment": "Used to detect metabolic acidosis."},
    "eGFR": {"range": "80 - 100", "unit": "mls/min/1.73m²", "comment": "Estimates kidney filtration rate."},
    "Uric Acid": {"range": "155 - 428", "unit": "µmol/L", "comment": "Elevated levels can cause gout."},
    "TSH": {"range": "0.4 - 4.5", "unit": "mIU/L", "comment": "Thyroid-stimulating hormone; high in hypothyroidism."},
    "Vitamin B12": {"range": "200 - 914", "unit": "pg/mL", "comment": "Low levels can cause anemia and neurological issues."},
    "BhCG": {"range": "0 - 5", "unit": "mlU/ml", "comment": "Used to confirm pregnancy."},
    "PSA": {"range": "0 - 4", "unit": "ng/ml", "comment": "Elevated levels may indicate prostate cancer or BPH."}
}

def evaluate_result(test_name: str, value: float):
    ref = lab_reference_ranges.get(test_name)
    if not ref or not ref["range"]:
        return "Unknown"
    try:
        if "-" in ref["range"]:
            low, high = map(float, ref["range"].split("-"))
            if value < low:
                return "Low"
            elif value > high:
                return "High"
            else:
                return "Normal"
        elif "<" in ref["range"]:
            limit = float(ref["range"].replace("<", "").strip())
            return "High" if value > limit else "Normal"
        elif ">" in ref["range"]:
            limit = float(ref["range"].replace(">", "").strip())
            return "Low" if value < limit else "Normal"
        else:
            return "Unknown"
    except Exception:
        return "Unknown"



@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
        user_columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("users")
            }
        )
        if "must_change_password" not in user_columns:
            await conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN "
                    "must_change_password BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
        patient_columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"] for column in inspect(sync_conn).get_columns("patients")
            }
        )
        patient_additions = {
            "phone": "VARCHAR",
            "email": "VARCHAR",
            "address": "VARCHAR",
            "relationship": "VARCHAR",
            "principal": "BOOLEAN NOT NULL DEFAULT TRUE",
            "ah_foz": "VARCHAR",
        }
        for column_name, column_definition in patient_additions.items():
            if column_name not in patient_columns:
                await conn.execute(
                    text(
                        f"ALTER TABLE patients ADD COLUMN "
                        f"{column_name} {column_definition}"
                    )
                )

        await conn.execute(
            text(
                "UPDATE users SET role = 'Medical Laboratory Scientist' "
                "WHERE lower(trim(role)) IN "
                "('lab technician', 'lab tech', 'labtech', 'labtechnician', "
                "'lab', 'lab scientist', 'medical lab scientist', "
                "'medical laboratory scientist')"
            )
        )
        await conn.execute(
            text(
                "UPDATE users SET role = 'Reception' "
                "WHERE lower(trim(role)) IN ('user', 'receptionist', 'reception')"
            )
        )
        await conn.execute(
            text(
                "UPDATE audit_logs SET role = 'Medical Laboratory Scientist' "
                "WHERE lower(trim(role)) IN "
                "('lab technician', 'lab tech', 'labtech', 'labtechnician', "
                "'lab', 'lab scientist', 'medical lab scientist', "
                "'medical laboratory scientist')"
            )
        )
        await conn.execute(
            text(
                "UPDATE audit_logs SET role = 'Reception' "
                "WHERE lower(trim(role)) IN ('user', 'receptionist', 'reception')"
            )
        )

        permission_rows = await conn.execute(
            text(
                "SELECT permission FROM role_permissions "
                "WHERE lower(trim(role)) IN "
                "('user', 'receptionist', 'reception', 'lab technician', "
                "'lab tech', 'labtech', 'labtechnician', 'lab', 'lab scientist', "
                "'medical lab scientist', 'medical laboratory scientist')"
            )
        )
        shared_permissions = list(dict.fromkeys(row[0] for row in permission_rows))
        await conn.execute(
            text(
                "DELETE FROM role_permissions WHERE lower(trim(role)) IN "
                "('user', 'receptionist', 'reception', 'lab technician', "
                "'lab tech', 'labtech', 'labtechnician', 'lab', 'lab scientist', "
                "'medical lab scientist', 'medical laboratory scientist')"
            )
        )
        for role_name in ("Medical Laboratory Scientist", "Reception"):
            for permission in shared_permissions:
                await conn.execute(
                    text(
                        "INSERT INTO role_permissions (role, permission) "
                        "VALUES (:role, :permission)"
                    ),
                    {"role": role_name, "permission": permission},
                )

    # Initialize admin and lab tests
    async with async_session() as db:
        await init_lab_tests(db)



async def init_lab_tests(db: AsyncSession):
    # Check if table already has data
    result = await db.execute(select(LabTest))
    existing = result.scalars().first()

    if existing:
        misplaced_tests = await db.execute(
            select(LabTest).where(
                LabTest.name.in_(
                    ["Fasting Blood Sugar", "Serum Iron Levels", "Serum Amylase"]
                )
            )
        )
        for test in misplaced_tests.scalars():
            test.category = "Chemistry Tests"
        bilharzia = await db.execute(
            select(LabTest).where(
                LabTest.name == "Bilharzia Serology",
                LabTest.category == "Serology",
            )
        )
        if bilharzia.scalar_one_or_none() is None:
            db.add(LabTest(name="Bilharzia Serology", category="Serology"))
        await db.commit()
        return  # Database already has tests

    # If empty, insert default tests
    default_tests = {
     "Tumor Markers": [
        "PSA", "CA-125", "CEA", "AFP", "CA 19-9", "CA 15-3", "CA 72-4",
        "Thyroglobulin", "Calcitonin", "Beta-2 Microglobulin",
        "NSE", "CYFRA 21-1", "LDH", "HE4"
    ],

    "Serology": [
        "HIV test", "BhCG", "Widal", "HbsAg", "HSV 1", "HSV 2", "HSV", "Syphilis", "H.pylori",
        "CRP", "RF", "TORCH", "ANA", "Allergy", "Urine Drug Test",
        "Hepatitis A IgM", "Hepatitis C Antibody", "Rubella", "Measles IgG/IgM",
        "Varicella-Zoster IgG/IgM", "COVID-19 IgG/IgM", "Dengue NS1 IgM/IgG",
        "Zika IgM", "Yellow Fever Antibody", "Bilharzia Serology"
    ],

    "Full Blood Count (FBC)": [
        "WBC", "RBC", "HB", "HCT",  
        "MCV", "MCH", "MCHC", "RDW", "Platelets",
          "Neutrophils (%)", "Lymphocytes (%)", "Monocytes (%)",
            "Neutrophils", "Lymphocytes", "Monocytes"
        
    ],

    "Hematology": [
         "PDW", "Blood Group","Reticulocyte Count", "ESR", "INR", "D-Dimer",
         "Folic Acid", "Lactic acid", "Retic Count",
         
    ],

    "Cytology": ["LBC", "Peripheral Blood Smear", "Pap Smear"],

    "Urea & Electrolytes": [
        "Sodium", "Potassium", "Chloride", "Bicarbonate", "Urea", "Creatinine", "Anion Gap (corrected)", "eGFR (CKD-EPI)"
    ],

    "LFT (Liver Function Test)": [
        "ALT", "AST", "ALP",
          "GGT", "Direct Bilirubin", 
          "Total Bilirubin", "Albumin", 
          "Total Protein", "Globulin"
    ],

    
    "Fluid Biochemistry": [
        "Glucose", 
          "Total Protein", "Fluid Albumin",
          "Chloride", "LDH"
    ],

    "Serum Iron Studies": [
        "Iron", 
          "Transferrin", "% Iron saturation",
          "Ferritin", "TIBC", "Soluble Transferrin Receptor"
    ],

    "CAMP": [
        "Calcium", "Albumin", "Magnesium", "Phosphate", "Corrected Calcium"
    ],

    "Cardiac Enzymes": [
        "Myoglobin", "CK-MB", "CK", "AST", "LDH", "Cardiac Troponin I"
    ],

    "Lipid Profile": [
        "Total Cholesterol",
          "Triglycerides",  "HDL Cholesterol", 
          "LDL Cholesterol", "VLDL Cholesterol",
            "NON-HDL Cholesterol", "Total Chol/HDL Ratio"
    ],

    "Insulin Test": [
       "Serum Insulin"
    ],


    "RPR, TPHA": [
       "RPR", "TPHA"
    ],

    "H.pylori": [
       "IgG", "IgM"
    ],

     "Glycosylated Hb (HbA1C)": [
       "Glycosylated Hb (%)", "Estimated average glucose", "Non-diabities mellitus", "Diabetes mellitus"
    ],


     "Torch Screen": [
       "Toxoplasma (IgM)", "Toxoplasma (IgG)", "Rubella (IgM)", "Rubella (IgM)",
       "CMV (IgM)", "CMV (IgG)", "HSV 1 (IgG)", "HSV 1 (IgM)",
       "HSV 2 (IgG)", "HSV 2 (IgM)"
    ],

     "CRP, HS CRP": [
       "CRP", "HS CRP"
    ],

    "CD4 Count": [
       "CD4", "CD4%"
    ],

     "Clotting Profile": [
       "Patient: Prothrombin time", "Control: Prothrombin time", "INR", "APTT: Patient", "APTT: Control"
    ],

    "Female hormones": [
       "Estradiol", "Progesterone", "FSH", "LH",  "Prolactin", "Testosterone"
    ],

    "Progesterone": [
       "Progesterone", "Folicular phase", "Luteal phase", "Post Menopause female", "Preg 1st Trimester",
       "Preg 2nd Trimester", "Preg 3rd Trimester", "Progesterone"
    ],

     "CrAg Test": [
       "CSF CrAg", "Serum CrAg", "Detection LATEX TITRE", "Control LATEX TITRE"
    ],

     "Thyroid Function Test ": [
       "TSH", "Free T3", "Free T4"
    ],


    "Chemistry Tests": [
        "Blood Glucose (RBS)", "Fasting Blood Sugar", "Serum Iron Levels", "Serum Amylase",
         "Amylase", "Lipase",
        "Iron Studies", "Ferritin", "Transferrin", "Vitamin B12", "Folate"
    ],

     "Widal Test": [
       "Salmonella paratyphi AH", "Salmonella paratyphi BH",
       "Salmonella paratyphi CH", "Salmonella paratyphi AO",
       "Salmonella paratyphi BO", "Salmonella paratyphi CO",
       "Salmonella typhi H", "Salmonella typhi O"
    ],

    "Fluid M/C/S": [
        "Type", "Appearance", "Clarity", "Clot", "WBC's",
        "RBC's", "Lymphocytes", "Polymophs",
        "Other WBC's", "Organisms", "Protein"
    ],

     "Rectal Swab M/C/S": [
         "Color", "Consistency", "Occult blood", "WBC",
        "RBC", "Mucus", "Isospora belli",
        "Cryprosporidium", "Pitparasites"
    ],


    "Urine Microscopy": [
        "Type", "Color", "Clarity", "WBC",
        "RBC", "Epithelial cells", "Trichomonas vaginalis",
        "Bacteria", "Schistosoma", "Casts", "Yeasts"
    ],

    "Urine Chem": [
        "Leukocytes", "Nitrites", "Blood",
        "S.G", "P.H", "Protein",
        "Glucose", "Ketones", "Urobilinogen", "Bilirubin"
    ],
    
    "Urine Albumin Creatinine Ratio": [
        "U-Albumin", "U-Creatine", "U-Albumin/Crea Ration"
    ],
    
      "Urine Drug Test": [
        "Amphetamine", "Barbiturate", "Buprenorphine", "Benzodiazepine",
        "Ecstacy", "Methamphetamine", "Methadone", "Opiates",
        "Oxycodone", "Phencyclidne", "Antidepressants", "Marijuana"
    ],
    

    "Stool M/C/S": [
         "Color", "Consistency", "WBC",
        "RBS", "Mucus", "Ova", "Cysts", "Parasites", 
    ],

    "Sputum AAFBS": [
         "Appearance", "ZN Slide 1", "ZN Slide 2",
        "ZN Slide 3"
    ],

    "Swab M/C/S": [
        "Gram stain", "Bacteria", "WBC",
        "RBC", "Epithelial cells", "Clue cells",
        "T-Vaginalis",
        "Lactobacilli", "Yeasts/Buds","Organisms", "Other" 
                ],

    "Sputum M/C/S": [
         "Epithelial cells", "Appearance", "WBC",
        "RBC", "Organisms",
        "Other", "ZN STAIN", "GRAM STAIN", "ZN Slide 3"
    ],      
    
    "Sputum for Gene Xpert": [
        "Gene Xpert"
    ],      

    "Microbiology": [
        "Malaria Test", "Urine Culture", "Blood Culture", "Sputum Culture",
        "Stool Culture", "Throat Swab Culture", "Antibiotic Sensitivity Test",
        "Urinalysis", "Microscopy", "KOH Prep", "Fungal Culture",
        "CSF Culture", "Catheter tip MCs"
    ],

    "TB Tests": [
        "PCR TB", "Tuberculosis GeneXpert", "Mantoux Test", "TB Culture", "AFB Smear"
    ],

     "Hepatitis A": [
       "lblParameter_757"
    ],

    "Hepatitis B": [
       "HBeAg", "HBsAb", "HBsAg", "HBeAb", "HBcAb"
    ],


    "HPV Tests":  [
            "HPV 16", "HPV 18", "HPV 31", "HPV 33", "HPV 35",
            "HPV 39", "HPV 45", "HPV 51", "HPV 52", "HPV 56",
            "HPV 58", "HPV 59", "HPV 66", "HPV 68",
              "HPV 6", "HPV 11", "HPV 40", "HPV 42", "HPV 43",
            "HPV 44", "HPV 54", "HPV 61", "HPV 70", "HPV 72", "HPV 81"
        ],

     "HPV HR PCR Tests":  [
            "HPV 16", "HPV 18", "HPV 31", "HPV 33", "HPV 35",
            "HPV 39", "HPV 45", "HPV 51", "HPV 52", "HPV 56",
            "HPV 58", "HPV 59", "HPV 66", "HPV 68", "HPV 51/56/66/68"
            
        ],

        "Viral Load": [
       "HIV RNA (Viral Load)"
    ],


     "HPV LR PCR Tests":  [
              "HPV 6", "HPV 11", "HPV 40", "HPV 42", "HPV 43",
            "HPV 44", "HPV 54", "HPV 61", "HPV 70", "HPV 72", "HPV 81"
        ],

    "HIV Test": [
       "Determine", "CHEMBIO", "INSTI", "Final Result"
    ],

    "STI 12PCR Panel": [
        "Neisseria gonorrhoeae", "Chlamydia trachomatis", "Treponema pallidum",
        "Trichomonas vaginalis", "Ureaplasma urealyticum", "Ureaplasma parvum",
        "Mycoplasma genitalium", "Mycoplasma hominis", "HSV 1", "HSV 2",
        "Candida Albicans", "Gardnerella vaginalis"
    ],

  "STI 6 PCR Panel": [
        "Neisseria gonorrhoeae", "Chlamydia trachomatis", "Treponema pallidum",
         "Ureaplasma urealyticum", 
        "Mycoplasma genitalium", "Mycoplasma hominis"
        
    ],

    "Molecular Tests": [
        "DNA Extraction", "BRCA 1/2 Mutation Analysis", "HIV Viral Load",
        "Hepatitis B Viral Load", "Hepatitis C Viral Load",
        "COVID-19 Ab", "Influenza PCR", "RSV PCR", "HBV Genotyping",
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
        "Standard Paternity Test", "Extended Family Test",
        "Forensic DNA Profiling", "Ancestry DNA Testing",
        "Y-STR Profiling", "mtDNA Profiling"
    ],

    "Allergy Tests": [
        "Allergy", "Food Allergy Panel", "Environmental Allergy Panel",
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


    # Remove duplicates
    seen = set()
    all_tests = await db.execute(select(LabTest))
    for test in all_tests.scalars():
        key = (test.category, test.name)
        if key in seen:
            await db.delete(test)
        else:
            seen.add(key)

    for category, tests in default_tests.items():
        for test_name in tests:
            existing = await db.execute(select(LabTest).where(LabTest.category == category, LabTest.name == test_name))
            if not existing.scalar():
                db.add(LabTest(category=category, name=test_name))

    await db.commit()


# ===== NOTE: Lab test endpoints are defined later in the file with proper auth =====

# # Add a new lab test (Moved below with proper authentication)
# @app.post("/lab-tests/add", response_model=LabTestOut)
# async def add_lab_test(...)

# Get all lab tests
@app.get("/lab-tests", response_model=list[LabTestOut])
async def get_lab_tests(db: AsyncSession = Depends(get_db)):
    return await crud.get_all_lab_tests(db)

# # Optional: delete a test (Moved below with proper authentication)
# @app.delete("/lab-tests/{test_id}")
# async def delete_lab_test(...)


# ==============================
# TOKEN UTILITY
# ==============================
def create_access_token(data: dict, expires_delta: timedelta = None):
    payload = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    if not token:
        raise HTTPException(status_code=401, detail="Token missing")

    try:
        # Decode JWT safely
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.DecodeError, jwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Invalid token format")

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.must_change_password and not request.url.path.rstrip("/").endswith(
        "/auth/change-password"
    ):
        raise HTTPException(
            status_code=403,
            detail="You must change your password before continuing",
        )
    request.state.current_user = user
    return user


def normalize_role(role: str | None) -> str:
    if not role:
        return ""
    normalized = " ".join(role.strip().replace("_", " ").replace("-", " ").split()).lower()
    compact = normalized.replace(" ", "")
    if normalized in {"user", "receptionist", "reception"}:
        return "reception"
    if normalized in {
        "lab technician",
        "lab tech",
        "lab scientist",
        "medical lab scientist",
        "medical laboratory scientist",
    } or compact in {
        "labtech",
        "labtechnician",
        "medicallaboratoryscientist",
        "medicallaboratoryscientist",
        "mls",
    }:
        return "medical laboratory scientist"
    return normalized


def canonical_role(role: str | None) -> str:
    if not role:
        return ""
    normalized = normalize_role(role)
    if normalized == "medical laboratory scientist":
        return "Medical Laboratory Scientist"
    if normalized == "reception":
        return "Reception"
    return " ".join(word.capitalize() for word in normalized.split())


ADMIN_EQUIVALENT_ROLES = {
    "medical laboratory scientist",
    "reception",
}

def role_required(*roles):
    allowed_roles = {normalize_role(r) for r in roles} | ADMIN_EQUIVALENT_ROLES

    async def wrapper(user=Depends(get_current_user)):
        if not user or normalize_role(user.role) not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")
        return user
    return wrapper


def strict_role_required(*roles):
    """Requires exact role match - no equivalent roles. Used for admin-only operations."""
    allowed_roles = {normalize_role(r) for r in roles}

    async def wrapper(user=Depends(get_current_user)):
        if not user or normalize_role(user.role) not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden: Only admins can perform this action")
        return user
    return wrapper


# ==============================
# AUTHENTICATION ROUTES
# ==============================
@app.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    request: Request = None
):
    user = await crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Audit log: failed login attempt
        try:
            ip = request.client.host if request and request.client else None
            await crud.create_audit_log(
                db=db,
                role="Unknown",
                action="LOGIN FAILED",
                details=f"Failed login attempt for username: {form_data.username}",
                ip_address=ip,
                username=form_data.username
            )
        except Exception as e:
            print(f"Failed to log audit: {e}")
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # Create token with username + role
    token_data = {"sub": user.username, "role": user.role}
    token = create_access_token(token_data)
    
    # Audit log: successful login
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="LOGIN",
            details=f"User logged in successfully",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "must_change_password": user.must_change_password,
    }


@app.post("/auth/change-password")
async def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.verify_password(data.current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="Choose a password different from your temporary password",
        )
    if len(data.new_password) < 12 or len(data.new_password) > 72:
        raise HTTPException(
            status_code=422,
            detail="Password must be between 12 and 72 characters",
        )

    current_user.set_password(data.new_password)
    current_user.must_change_password = False
    await db.commit()
    return {"message": "Password changed successfully"}

# ==============================
# USER ROUTES
# ==============================
@app.post("/users/", response_model=UserOut)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db), request: Request = None):
    result = await db.execute(select(User))
    if result.scalars().first():
        raise HTTPException(status_code=403, detail="User registration disabled. Only Admin can add users.")
    user.role = "Admin"
    new_user = User(username=user.username, email=user.email, role=user.role)
    new_user.set_password(user.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Audit log: admin user registration
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role="Admin",
            action="CREATE USER (Admin)",
            details=f"Created admin user: {new_user.username}",
            ip_address=ip,
            user_id=new_user.id,
            username=new_user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return new_user

@app.get("/users/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/admin/create-user")
async def create_user_admin(
    data: AdminCreateUser, 
    db: AsyncSession = Depends(get_db), 
    current_user=Depends(strict_role_required("Admin", "Super Admin")),
    request: Request = None
):
    # Check if user already exists
    result = await db.execute(select(User).where(User.username == data.username))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        username=data.username,
        email=data.email,
        role=canonical_role(data.role)
    )
    new_user.set_password(data.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Audit log: admin created user
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=current_user.role,
            action="CREATE USER",
            details=f"Created user: {new_user.username} with role: {new_user.role}",
            ip_address=ip,
            user_id=current_user.id,
            username=current_user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return {"message": f"User '{new_user.username}' created successfully", "user": new_user}

@app.get("/admin/users")
async def get_all_users(db: AsyncSession = Depends(get_db), current_user=Depends(strict_role_required("Admin", "Super Admin"))):
    result = await db.execute(select(User))
    return result.scalars().all()

@app.put("/admin/users/{user_id}")
async def update_user(
    user_id: int,
    data: AdminCreateUser,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(strict_role_required("Admin", "Super Admin")),
):
    """
    Update user information (username, email, role, password optional).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user fields
    user.username = data.username
    user.email = data.email
    user.role = canonical_role(data.role)

    # Only update password if provided
    if data.password:
        user.hashed_password = pwd_context.hash(data.password)

    try:
        await db.commit()
        await db.refresh(user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

    return {"message": f"User {user.username} updated successfully", "user": user}


@app.patch("/admin/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(strict_role_required("Admin", "Super Admin")),
):
    """
    Deactivate a user account (set is_active to False).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to deactivate user: {str(e)}")

    return {"message": f"User {user.username} deactivated successfully"}


@app.patch("/admin/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(strict_role_required("Admin", "Super Admin")),
):
    """
    Activate a user account (set is_active to True).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to activate user: {str(e)}")

    return {"message": f"User {user.username} activated successfully"}


# ==============================
# ADMIN EXPORT ENDPOINTS (ADMIN ONLY)
# ==============================
@app.get("/admin/patients/export")
async def export_all_patients(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(strict_role_required("Admin", "Super Admin")),
):
    """
    Export all patient data for download (Admin only).
    Returns all patients with their lab requests and results.
    """
    result = await db.execute(
        select(Patient).options(
            selectinload(Patient.lab_requests).selectinload(LabRequest.lab_results)
        )
    )
    patients = result.scalars().unique().all()
    return {"patients": patients, "count": len(patients)}


@app.get("/admin/patients/{patient_id}/export")
async def export_single_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(strict_role_required("Admin", "Super Admin")),
):
    """
    Export single patient data for download (Admin only).
    Returns patient with all lab requests and results.
    """
    result = await db.execute(
        select(Patient)
        .where(Patient.id == patient_id)
        .options(
            selectinload(Patient.lab_requests).selectinload(LabRequest.lab_results)
        )
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"patient": patient}


@app.get(
    "/api/audit-logs",
    response_model=List[AuditLogOut],
)
async def read_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(strict_role_required("Admin", "Super Admin")),
):
    logs = await get_audit_logs(db)
    return logs

@app.post("/api/audit-logs/email-sent", status_code=201)
async def record_email_sent_event(
    event: EmailSentAuditEvent,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not event.recipients or len(event.recipients) > 500:
        raise HTTPException(
            status_code=422,
            detail="Provide between 1 and 500 email recipients.",
        )

    await crud.create_audit_log(
        db=db,
        role=current_user.role,
        action="SEND EMAIL",
        details=(
            "Outlook message accepted by Microsoft for recipients: "
            + ", ".join(str(address) for address in event.recipients)
        ),
        ip_address=request.client.host if request.client else None,
        user_id=current_user.id,
        username=current_user.username,
    )
    return {"message": "Email activity recorded."}


@app.post("/api/audit-logs/email-compose", status_code=201)
async def record_email_compose_event(
    event: EmailSentAuditEvent,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not event.recipients or len(event.recipients) > 500:
        raise HTTPException(
            status_code=422,
            detail="Provide between 1 and 500 email recipients.",
        )

    await crud.create_audit_log(
        db=db,
        role=current_user.role,
        action="OPEN EMAIL DRAFT",
        details=(
            "Requested handoff to the default email app for recipients: "
            + ", ".join(str(address) for address in event.recipients)
            + ". Delivery is not verified."
        ),
        ip_address=request.client.host if request.client else None,
        user_id=current_user.id,
        username=current_user.username,
    )
    return {"message": "Email draft activity recorded."}


_AUDIT_MANUAL_ENDPOINTS = {
    ("POST", "/token"),
    ("POST", "/users/"),
    ("POST", "/admin/create-user"),
    ("POST", "/patients/"),
    ("PUT", "/patients/{patient_id}"),
    ("POST", "/lab-tests/add"),
    ("DELETE", "/lab-tests/{test_id}"),
    ("POST", "/lab-requests/"),
    ("POST", "/lab-results/"),
    ("POST", "/lab-results/save"),
    ("PUT", "/system-settings/"),
    ("POST", "/system-settings/verify-payment/"),
    ("PUT", "/admin/permissions/"),
}
_AUDIT_IGNORED_ROUTES = {
    "/",
    "/health",
    "/docs",
    "/docs/oauth2-redirect",
    "/openapi.json",
    "/redoc",
    "/{full_path:path}",
}


async def _record_request_audit(
    request: Request,
    status_code: int,
) -> None:
    method = request.method.upper()
    route = request.scope.get("route")
    route_path = getattr(route, "path", request.url.path)
    if (
        method not in {"GET", "POST", "PUT", "PATCH", "DELETE"}
        or route_path in _AUDIT_IGNORED_ROUTES
        or (method, route_path) == ("POST", "/token")
        or (
            status_code < 400
            and route_path
            in {
                "/api/audit-logs",
                "/api/audit-logs/email-sent",
                "/api/audit-logs/email-compose",
            }
        )
        or (status_code < 400 and (method, route_path) in _AUDIT_MANUAL_ENDPOINTS)
    ):
        return

    actor = getattr(request.state, "current_user", None)
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    actor_name = None
    if actor is None and scheme.lower() == "bearer" and token:
        try:
            claims = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            actor_name = claims.get("sub")
        except (jwt.ExpiredSignatureError, jwt.DecodeError, jwt.InvalidTokenError):
            pass

    details = f"path={request.url.path}; status={status_code}"
    try:
        async with async_session() as audit_db:
            if actor is None and actor_name:
                result = await audit_db.execute(
                    select(User).where(User.username == actor_name)
                )
                actor = result.scalar_one_or_none()
            await crud.create_audit_log(
                db=audit_db,
                role=actor.role if actor else "Unknown",
                action=f"{method} {route_path}",
                details=details,
                ip_address=request.client.host if request.client else None,
                user_id=actor.id if actor else None,
                username=actor.username if actor else None,
            )
    except Exception:
        logger.exception("Could not write audit event for %s %s", method, route_path)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
    except Exception:
        await _record_request_audit(request, 500)
        raise
    await _record_request_audit(request, response.status_code)
    return response

# ==============================
# PATIENT ROUTES
# ==============================
@app.post("/patients/", response_model=PatientOut)
async def create_patient_route(
    patient: PatientCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Medical Laboratory Scientist")),
    request: Request = None
):
    new_patient = await crud.create_patient(db, patient)
    
    # Audit log: patient created
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="CREATE PATIENT",
            details=f"Created patient: {new_patient.first_name} {new_patient.last_name}",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return new_patient

@app.get("/patients/{patient_id}", response_model=PatientOut)
async def get_patient_route(
    patient_id: int, 
    db: AsyncSession = Depends(get_db), 
    user=Depends(role_required("Admin", "Lab Technician", "Super Admin"))
):
    patient = await crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.put("/patients/{patient_id}", response_model=PatientOut)
async def update_patient_route(
    patient_id: int, 
    patient_update: PatientUpdate, 
    db: AsyncSession = Depends(get_db), 
    user=Depends(role_required("Admin", "Medical Laboratory Scientist")),
    request: Request = None
):
    patient = await crud.update_patient(db, patient_id, patient_update)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Audit log: patient updated
    try:
        ip = request.client.host if request and request.client else None
        changed_fields = list(patient_update.__dict__.keys()) if patient_update else []
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="UPDATE PATIENT",
            details=f"Updated patient {patient_id}: {patient.first_name} {patient.last_name}. Fields: {changed_fields}",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return patient


@app.get("/patients/", response_model=List[PatientOut])
async def list_patients(
    token: str = Depends(oauth2_scheme),  # ensures valid JWT is passed
    db: AsyncSession = Depends(get_db)
):
    # Optional: verify token and get current user here
    result = await db.execute(select(Patient))
    return result.scalars().all()

@app.get("/patients/search/", response_model=list[schemas.PatientSearchOut])
async def search_patients_route(
    query: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    tokens = [token.strip() for token in query.split() if token.strip()]
    if not tokens:
        raise HTTPException(status_code=400, detail="Invalid search query")

    token_conditions = []
    for token in tokens:
        token_q = f"%{token}%"
        token_conditions.append(or_(
            Patient.first_name.ilike(token_q),
            Patient.last_name.ilike(token_q),
            Patient.member_number.ilike(token_q),
        ))

    result = await db.execute(
        select(Patient)
        .where(and_(*token_conditions))
        .options(selectinload(Patient.lab_requests))
        .order_by(Patient.last_name, Patient.first_name, Patient.id)
    )

    patients = result.scalars().unique().all()
    for patient in patients:
        patient.lab_requests.sort(
            key=lambda visit: (visit.created_at is not None, visit.created_at),
            reverse=True,
        )
    return patients


# ==============================
# LAB TEST ROUTES
# ==============================
@app.post("/lab-tests/add", response_model=LabTestOut)
async def add_lab_test_route(
    lab_test: LabTestCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(strict_role_required("admin")),
    request: Request = None
):
    name = lab_test.name.strip()
    category = lab_test.category.strip()

    if not name or not category:
        raise HTTPException(status_code=400, detail="Lab test name and category are required")

    existing = await db.execute(
        select(LabTest).where(LabTest.name == name, LabTest.category == category)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Lab test already exists")

    new_test = LabTest(name=name, category=category)
    try:
        db.add(new_test)
        await db.commit()
        await db.refresh(new_test)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not add lab test: {str(e)}")
    
    # Audit log: lab test added
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="CREATE LAB TEST",
            details=f"Added new lab test: {new_test.name} in category: {new_test.category}",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return new_test

@app.get("/lab-requests/", response_model=List[LabRequestOut])
async def list_lab_requests_route(
    patient_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    if patient_id:
        result = await db.execute(
            select(models.LabRequest).where(models.LabRequest.patient_id == patient_id)
            .options(
                selectinload(models.LabRequest.patient)
            )
            .order_by(models.LabRequest.created_at.desc())
        )
        return result.scalars().unique().all()

    # If no patient_id, return all requests
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient)
        )
        .order_by(models.LabRequest.created_at.desc())
    )
    return result.scalars().unique().all()

@app.delete("/lab-tests/{test_id}")
async def delete_lab_test_route(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(strict_role_required("admin")),
    request: Request = None
):
    test = await db.get(LabTest, test_id)
    if not test:
        raise HTTPException(404, detail="Lab test not found")
    
    test_name = test.name
    test_category = test.category
    
    await db.delete(test)
    await db.commit()
    
    # Audit log: lab test deleted
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="DELETE LAB TEST",
            details=f"Deleted lab test: {test_name} from category: {test_category}",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return {"message": "Lab test deleted successfully"}

# ==============================
# LAB REQUESTS & RESULTS
# ==============================

# -------------------------------
# CREATE lab request
# -------------------------------
@app.post("/lab-requests/", response_model=schemas.LabRequestOut)
async def create_lab_request_endpoint(
    payload: schemas.LabRequestCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    request: Request = None
):
    lab_request = await crud.create_lab_request(db, payload)
    result = await db.execute(
        select(models.LabRequest)
        .options(selectinload(models.LabRequest.patient))
        .where(models.LabRequest.id == lab_request.id)
    )
    
    # Audit log: lab request created
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="CREATE LAB REQUEST",
            details=f"Created lab request {lab_request.id} for patient {lab_request.patient_id}",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return result.scalar_one()

@app.get("/lab-requests/{request_id}", response_model=schemas.LabRequestOut)
async def get_lab_request_endpoint(request_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient),
            selectinload(models.LabRequest.lab_results)
        )
        .where(models.LabRequest.id == request_id)
    )
    lab_request = result.scalar_one_or_none()
    if not lab_request:
        raise HTTPException(status_code=404, detail="Lab request not found")
    return lab_request

@app.put("/lab-requests/{request_id}", response_model=schemas.LabRequestOut)
async def update_lab_request_endpoint(
    request_id: int,
    payload: schemas.LabRequestUpdate,
    db: AsyncSession = Depends(get_db)
):
    # Use sync update since it’s a single object
    from sqlalchemy.orm import Session
    sync_db = Session(db.sync_session)  # Convert async session to sync for ORM update
    updated = crud.update_lab_request(sync_db, request_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Lab request not found")
    
    # Reload request with relationships
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient),
            selectinload(models.LabRequest.lab_results).selectinload(models.LabResult.lab_test)
        )
        .where(models.LabRequest.id == request_id)
    )
    return result.scalar_one()

@app.post("/lab-results/", response_model=schemas.LabResultRead, status_code=201)
async def create_lab_result_route(
    payload: LabResultCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Medical Laboratory Scientist", "Admin", "Super Admin")),
    request: Request = None
):
    result_data = await crud.create_lab_result(db, payload)
    
    # Audit log: lab result created
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="CREATE LAB RESULT",
            details=f"Created lab result for test {payload.lab_test_id} in request {payload.lab_request_id}",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return result_data

@app.get("/lab-requests/{request_id}/results/", response_model=List[schemas.LabResultRead])
async def lab_results_by_request_route(request_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await crud.get_lab_test_results_by_request(db, request_id)


@app.get("/lab-results/", response_model=List[schemas.LabResultListOut])
async def list_lab_results_route(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(
            models.LabResult.id,
            models.LabResult.patient_id,
            models.LabResult.lab_test_id,
            models.LabResult.lab_request_id,
            models.LabResult.test_name,
            models.LabResult.results,
            models.LabResult.unit,
            models.LabResult.ref_range,
            models.LabResult.flag,
            models.LabResult.comment,
            models.LabResult.created_at,
            models.LabTest.category.label("category"),
            models.Patient.first_name.label("patient_first_name"),
            models.Patient.last_name.label("patient_last_name"),
            models.LabRequest.created_at.label("request_created_at"),
            models.LabRequest.status.label("request_status"),
        )
        .join(models.Patient, models.Patient.id == models.LabResult.patient_id)
        .join(models.LabRequest, models.LabRequest.id == models.LabResult.lab_request_id)
        .outerjoin(models.LabTest, models.LabTest.id == models.LabResult.lab_test_id)
        .order_by(models.LabResult.created_at.desc(), models.LabResult.id.desc())
    )
    return [dict(row._mapping) for row in result.all()]


@app.post("/lab-results/save", response_model=schemas.LabResultRead)
async def save_lab_result(
    payload: schemas.LabResultSave,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Medical Laboratory Scientist", "Admin", "Super Admin")),
    request: Request = None
):
    result = await crud.create_lab_result(db, payload)
    
    # Audit log: lab result saved
    try:
        ip = request.client.host if request and request.client else None
        await crud.create_audit_log(
            db=db,
            role=user.role,
            action="SAVE LAB RESULT",
            details=f"Saved lab result for test {payload.lab_test_id} with value: {payload.results}",
            ip_address=ip,
            user_id=user.id,
            username=user.username
        )
    except Exception as e:
        print(f"Failed to log audit: {e}")
    
    return result
 
 

@app.patch("/lab-requests/{request_id}", response_model=LabRequestOut)
async def update_lab_request_route(
    request_id: int,
    payload: LabRequestUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Medical Laboratory Scientist", "Super Admin")),
):
    request_obj = await db.get(models.LabRequest, request_id)
    if not request_obj:
        raise HTTPException(status_code=404, detail="Lab request not found")

    if payload.status is not None:
        request_obj.status = payload.status
    if payload.notes is not None:
        request_obj.notes = payload.notes

    await db.commit()
    await db.refresh(request_obj)

    result = await db.execute(
        select(models.LabRequest)
        .options(selectinload(models.LabRequest.patient))
        .where(models.LabRequest.id == request_id)
    )
    return result.scalar_one()

@app.patch(
    "/lab-requests/{request_id}/recalculate-status",
    response_model=LabRequestOut
)
async def recalc_lab_request_status(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Medical Laboratory Scientist", "Super Admin"))
):
    result = await db.get(models.LabRequest, request_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Lab request not found")

    await db.refresh(result)
    return result

# ==============================
# PASSWORD RESET
# ==============================
@app.post("/auth/password-reset")
async def request_password_reset(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    token = crud.create_password_reset_token(data.email)
    print(f"RESET LINK → http://localhost:5173/reset?token={token}")
    return {"message": "If the email exists, a reset link has been sent."}

@app.post("/auth/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    try:
        payload = crud.verify_password_reset_token(data.token)
        email = payload["sub"]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if not crud.reset_user_password(db, email, data.new_password):
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Password reset successful"}

# ==============================
# PUBMED FETCH
# ==============================
#@app.get("/pubmed/")
#async def fetch_pubmed(query: str):
#    try:
#        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmode=json&retmax=20"
#        search_data = requests.get(search_url).json()
#        id_list = search_data.get("esearchresult", {}).get("idlist", [])
#        if not id_list:
#            return {"results": []}
#        ids = ",".join(id_list)
#        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={ids}&retmode=json"
#        summary_data = requests.get(summary_url).json()
#        articles = summary_data.get("result", {})
#        return {"results": [
#            {"pmid": pmid,
#             "title": articles.get(pmid, {}).get("title"),
#             "journal": articles.get(pmid, {}).get("fulljournalname"),
#             "pubdate": articles.get(pmid, {}).get("pubdate"),
#             "authors": articles.get(pmid, {}).get("authors"),
#             "doi": articles.get(pmid, {}).get("elocationid")}
#            for pmid in id_list if articles.get(pmid)
#        ]}
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=f"PubMed fetch failed: {str(e)}")

# ==============================
# SYSTEM SETTINGS & PAYMENT VERIFICATION
# ==============================
from app.config import (
    is_valid_payment_code,
    get_code_license_type,
)

@app.get("/system-settings/", response_model=schemas.SystemSettingsOut)
async def get_system_settings(db: AsyncSession = Depends(get_db)):
    """Fetch system settings including payment status"""
    try:
        from sqlalchemy import select
        
        result = await db.execute(select(SystemSettings))
        settings = result.scalar()
        
        if not settings:
            # Create default settings if none exist
            settings = SystemSettings(
                labname="BIOZONE Lab",
                turnaroundtime="24",
                enablenotifications=True,
                maintenancemode=False,
                defaultreportformat="PDF",
                dataretentiondays=365,
                paymentstatus="inactive",
            )
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        
        subscription = get_subscription_status(settings.lastpaymentdate)
        settings_out = schemas.SystemSettingsOut.model_validate(settings)
        settings_out.subscription_expires_at = subscription["expires_at"]
        settings_out.subscription_days_remaining = subscription["days_remaining"]
        settings_out.subscription_expired = subscription["expired"]
        return settings_out
    except Exception as e:
        print(f"Error fetching system settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system settings")


@app.put("/system-settings/", response_model=schemas.SystemSettingsOut)
async def update_system_settings(
    settings_update: schemas.SystemSettingsBase,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
    current_user: User = Depends(get_current_user),
):
    """Update system settings (only if system is not locked)"""
    try:
        from sqlalchemy import select
        
        result = await db.execute(select(SystemSettings))
        settings = result.scalar()
        
        if not settings:
            settings = SystemSettings()
            db.add(settings)
        
        # Update only provided fields
        update_data = settings_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(settings)

        # Audit log: who updated system settings
        try:
            ip = request.client.host if request and request.client else None
            changed_fields = list(update_data.keys()) if update_data else []
            await crud.create_audit_log(
                db=db,
                role=current_user.role,
                action="UPDATE system-settings",
                details=f"Updated fields: {changed_fields}",
                ip_address=ip,
                user_id=current_user.id,
                username=current_user.username,
            )
        except Exception:
            pass

        return settings
    except Exception as e:
        print(f"Error updating system settings: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update system settings")


@app.post("/system-settings/verify-payment/", response_model=schemas.PaymentVerificationResponse)
async def verify_payment(
    payment_req: schemas.PaymentVerificationRequest,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
    current_user: User = Depends(strict_role_required("Admin", "Super Admin")),
):
    """
    Verify a renewal code and unlock the system through month-end.
    
    Checks against stored payment codes in database first,
    then falls back to config codes if not found
    """
    try:
        from sqlalchemy import select
        
        code = payment_req.code.strip().upper()
        today = datetime.now().date()
        
        # First, check against database stored codes
        result = await db.execute(
            select(PaymentCode).where(
                PaymentCode.code == code,
                PaymentCode.validfrom <= today,
                PaymentCode.validuntil >= today,
                PaymentCode.isused.is_(False),
            )
        )
        payment_code = result.scalar()
        
        if payment_code:
            # Code found and is valid for current date
            license_type = payment_code.licensetype
            period = payment_code.period
            
            # Mark code as used
            payment_code.isused = True
            payment_code.useddate = datetime.utcnow()
            
            # Update system settings
            result = await db.execute(select(SystemSettings))
            settings = result.scalar()
            if not settings:
                settings = SystemSettings()
                db.add(settings)
            
            now = datetime.utcnow()
            settings.lastpaymentdate = now
            settings.paymentstatus = "active"
            settings.updated_at = now
            
            await db.commit()
            await db.refresh(settings)
            subscription = get_subscription_status(settings.lastpaymentdate)
            
            print(f"[PAYMENT] Database code verified ({period}, {license_type})")
            # Audit log: successful verification using DB code
            try:
                ip = request.client.host if request and request.client else None
                await crud.create_audit_log(
                    db=db,
                    role=current_user.role,
                    action="VERIFY PAYMENT (DB)",
                    details=f"Payment code redeemed (period={period}, license={license_type}).",
                    ip_address=ip,
                    user_id=current_user.id,
                    username=current_user.username,
                )
            except Exception:
                pass

            return schemas.PaymentVerificationResponse(
                success=True,
                message=(
                    "Subscription renewed through "
                    f"{subscription['expires_at'].strftime('%B %d, %Y')}."
                ),
                lastPaymentDate=settings.lastpaymentdate
            )
        
        # Fall back to config codes if database code not found
        if not is_valid_payment_code(code):
            try:
                await crud.create_audit_log(
                    db=db,
                    role=current_user.role,
                    action="VERIFY PAYMENT FAILED",
                    details="Payment verification rejected an invalid code.",
                    ip_address=request.client.host if request.client else None,
                    user_id=current_user.id,
                    username=current_user.username,
                )
            except Exception:
                logger.exception("Could not audit failed payment verification")
            return schemas.PaymentVerificationResponse(
                success=False,
                message="Invalid payment verification code. Please contact your administrator."
            )
        
        # Get license type for logging
        license_type = get_code_license_type(code)
        
        # Update system settings with current date
        result = await db.execute(select(SystemSettings))
        settings = result.scalar()
        if not settings:
            settings = SystemSettings()
            db.add(settings)
        
        now = datetime.utcnow()
        settings.lastpaymentdate = now
        settings.paymentstatus = "active"
        settings.updated_at = now
        
        await db.commit()
        await db.refresh(settings)
        subscription = get_subscription_status(settings.lastpaymentdate)

        print(f"[PAYMENT] Configured renewal code verified for {license_type}")
        try:
            ip = request.client.host if request and request.client else None
            await crud.create_audit_log(
                db=db,
                role=current_user.role,
                action="VERIFY PAYMENT (CONFIG)",
                details=f"Payment code redeemed (license={license_type}).",
                ip_address=ip,
                user_id=current_user.id,
                username=current_user.username,
            )
        except Exception:
            pass

        return schemas.PaymentVerificationResponse(
            success=True,
            message=(
                "Subscription renewed through "
                f"{subscription['expires_at'].strftime('%B %d, %Y')}."
            ),
            lastPaymentDate=settings.lastpaymentdate
        )
    except Exception as e:
        print(f"Error verifying payment: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Payment verification failed")


@app.get("/payment-codes/", response_model=schemas.PaymentCodesList)
async def get_payment_codes(
    includeUsed: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(strict_role_required("Admin", "Super Admin")),
):
    """Get all available payment codes (admin only)"""
    try:
        from sqlalchemy import select, func
        
        if includeUsed:
            result = await db.execute(select(PaymentCode))
            codes = result.scalars().all()
        else:
            result = await db.execute(select(PaymentCode).where(PaymentCode.isUsed == False))
            codes = result.scalars().all()
        
        result = await db.execute(select(func.count(PaymentCode.id)))
        total = result.scalar()
        
        result = await db.execute(select(func.count(PaymentCode.id)).where(PaymentCode.isUsed == True))
        used = result.scalar()
        
        active = total - used
        
        return schemas.PaymentCodesList(
            codes=codes,
            total=total,
            active=active,
            used=used
        )
    except Exception as e:
        print(f"Error fetching payment codes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment codes")


@app.post("/payment-codes/create/", response_model=schemas.PaymentCodeOut)
async def create_payment_code(
    code_data: schemas.PaymentCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(strict_role_required("Admin", "Super Admin")),
):
    """Create a new payment code"""
    try:
        from sqlalchemy import select
        
        # Check if code already exists
        result = await db.execute(select(PaymentCode).where(PaymentCode.code == code_data.code))
        existing = result.scalar()
        if existing:
            raise HTTPException(status_code=400, detail="Code already exists")
        
        payment_code = PaymentCode(
            code=code_data.code.upper(),
            validfrom=code_data.validfrom,
            validuntil=code_data.validuntil,
            period=code_data.period,
            licenseType=code_data.licenseType,
            description=code_data.description,
            isUsed=False
        )
        
        db.add(payment_code)
        await db.commit()
        await db.refresh(payment_code)
        
        print(f"[ADMIN] New payment code created: {payment_code.code} ({payment_code.period})")
        
        return payment_code
    except Exception as e:
        print(f"Error creating payment code: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create payment code")


@app.post("/payment-codes/bulk-create/")
async def bulk_create_payment_codes(
    codes_data: List[schemas.PaymentCodeCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(strict_role_required("Admin", "Super Admin")),
):
    """Create multiple payment codes at once"""
    try:
        from sqlalchemy import select
        
        created_codes = []
        failed_codes = []
        
        for code_data in codes_data:
            try:
                # Check if code already exists
                result = await db.execute(select(PaymentCode).where(PaymentCode.code == code_data.code))
                existing = result.scalar()
                if existing:
                    failed_codes.append({
                        "code": code_data.code,
                        "error": "Code already exists"
                    })
                    continue
                
                payment_code = PaymentCode(
                    code=code_data.code.upper(),
                    validfrom=code_data.validfrom,
                    validuntil=code_data.validuntil,
                    period=code_data.period,
                    licensetype=code_data.licensetype,
                    description=code_data.description,
                    isused=False
                )
                
                db.add(payment_code)
                created_codes.append(code_data.code)
            except Exception as e:
                failed_codes.append({
                    "code": code_data.code,
                    "error": str(e)
                })
        
        await db.commit()
        
        print(f"[ADMIN] Bulk created {len(created_codes)} payment codes")
        
        return {
            "success": True,
            "created": len(created_codes),
            "failed": len(failed_codes),
            "created_codes": created_codes,
            "failed_codes": failed_codes
        }
    except Exception as e:
        print(f"Error bulk creating payment codes: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to bulk create payment codes")


# ==============================
# ROLE PERMISSIONS ROUTES
# ==============================
@app.get("/admin/permissions/")
async def get_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(strict_role_required("Admin", "Super Admin"))
):
    """Get all role permissions"""
    try:
        from sqlalchemy import select
        
        result = await db.execute(select(models.RolePermission))
        perms = result.scalars().all()
        
        # Group by role
        permissions_dict = {}
        for perm in perms:
            if perm.role not in permissions_dict:
                permissions_dict[perm.role] = []
            permissions_dict[perm.role].append(perm.permission)
        
        return {"permissions": permissions_dict}
    except Exception as e:
        print(f"Error fetching permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch permissions")


@app.put("/admin/permissions/")
async def update_permissions(
    data: schemas.PermissionsUpdate,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
    current_user: User = Depends(strict_role_required("Admin", "Super Admin"))
):
    """Update role permissions"""
    try:
        from sqlalchemy import select, delete
        
        # Delete all existing permissions
        await db.execute(delete(models.RolePermission))
        await db.commit()
        
        normalized_permissions = {}
        for role, permissions in data.permissions.items():
            role_name = canonical_role(role)
            normalized_permissions.setdefault(role_name, set()).update(permissions)

        shared_roles = ("Medical Laboratory Scientist", "Reception")
        shared_permissions = set().union(
            *(normalized_permissions.get(role, set()) for role in shared_roles)
        )
        for role in shared_roles:
            normalized_permissions[role] = shared_permissions

        # Insert canonical role permissions; these two roles share one permission set.
        for role, permissions in normalized_permissions.items():
            for permission in permissions:
                perm_obj = models.RolePermission(
                    role=role,
                    permission=permission
                )
                db.add(perm_obj)
        
        await db.commit()
        
        # Audit log
        try:
            ip = request.client.host if request and request.client else None
            roles_updated = list(data.permissions.keys())
            await crud.create_audit_log(
                db=db,
                role=current_user.role,
                action="UPDATE role-permissions",
                details=f"Updated permissions for roles: {roles_updated}",
                ip_address=ip,
                user_id=current_user.id,
                username=current_user.username,
            )
        except Exception:
            pass
        
        return {"message": "Permissions updated successfully"}
    except Exception as e:
        print(f"Error updating permissions: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update permissions")


# ==============================
# STATIC FILES AND SPA FALLBACK
# ==============================

# Get the absolute path to the frontend dist folder
FRONTEND_DIST_PATH = Path(__file__).parent.parent.parent / "frontend" / "dist"

# Mount the static assets folder
if FRONTEND_DIST_PATH.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_PATH / "assets")), name="assets")

# Serve index.html for all non-API routes (SPA fallback)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA - fallback for all routes except API endpoints"""
    # Don't serve SPA for API routes
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi"):
        raise HTTPException(status_code=404, detail="Not found")
    
    index_path = FRONTEND_DIST_PATH / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="Frontend not built")


# ==============================
# ROOT
# ==============================
@app.get("/")
async def root():
    """Serve the React SPA"""
    index_path = FRONTEND_DIST_PATH / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"msg": "Biozone API running - Frontend build not found"}

# ==============================
# BACKUP
# ==============================
@app.get("/backup")
async def backup_data(db: AsyncSession = Depends(get_db), user=Depends(role_required("Admin"))):
    """Backup all data as downloadable JSON file (Admin only)"""
    from app.models import User, Patient, LabTest, LabRequest, LabResult, PaymentCode, SystemSettings, AuditLog
    import json
    from datetime import datetime
    from fastapi.responses import Response

    backup = {
        "timestamp": datetime.utcnow().isoformat(),
        "tables": {}
    }

    # Backup each table
    tables = {
        "users": User,
        "patients": Patient,
        "lab_tests": LabTest,
        "lab_requests": LabRequest,
        "lab_results": LabResult,
        "payment_codes": PaymentCode,
        "system_settings": SystemSettings,
        "audit_logs": AuditLog
    }

    for table_name, model in tables.items():
        result = await db.execute(select(model))
        records = result.scalars().all()
        backup["tables"][table_name] = [{k: v for k, v in record.__dict__.items() if k != '_sa_instance_state'} for record in records]

    json_data = json.dumps(backup, indent=2, default=str)
    return Response(content=json_data, media_type="application/json", headers={"Content-Disposition": "attachment; filename=biozone_backup.json"})

@app.post("/restore")
async def restore_data(backup: dict, db: AsyncSession = Depends(get_db), user=Depends(role_required("Admin"))):
    """Restore data from backup JSON (Admin only) - WARNING: This will overwrite existing data"""
    from app.models import User, Patient, LabTest, LabRequest, LabResult, PaymentCode, SystemSettings, AuditLog
    from sqlalchemy import delete

    if "tables" not in backup:
        raise HTTPException(status_code=400, detail="Invalid backup format")

    # Clear existing data (optional, but for full restore)
    tables = {
        "audit_logs": AuditLog,
        "lab_results": LabResult,
        "lab_requests": LabRequest,
        "payment_codes": PaymentCode,
        "system_settings": SystemSettings,
        "patients": Patient,
        "lab_tests": LabTest,
        "users": User  # Clear users last
    }

    for table_name, model in tables.items():
        await db.execute(delete(model))

    # Restore data
    for table_name, records in backup["tables"].items():
        if table_name == "users":
            for record in records:
                # Hash password if present
                if "password" in record:
                    record["password"] = pwd_context.hash(record["password"])
                db.add(User(**record))
        elif table_name == "patients":
            for record in records:
                db.add(Patient(**record))
        elif table_name == "lab_tests":
            for record in records:
                db.add(LabTest(**record))
        elif table_name == "lab_requests":
            for record in records:
                db.add(LabRequest(**record))
        elif table_name == "lab_results":
            for record in records:
                db.add(LabResult(**record))
        elif table_name == "payment_codes":
            for record in records:
                db.add(PaymentCode(**record))
        elif table_name == "system_settings":
            for record in records:
                db.add(SystemSettings(**record))
        elif table_name == "audit_logs":
            for record in records:
                db.add(AuditLog(**record))

    await db.commit()
    return {"message": "Data restored successfully"}
