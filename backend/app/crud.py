from typing import List, Optional
from app.models import User  # <-- add this line
from passlib.hash import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload, Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from app.schemas import AdminCreateUser
from app.models import AuditLog
from app import models, schemas
from fastapi import HTTPException
from app.schemas import LabResultCreate
# ============================================================
# PASSWORD & JWT HELPERS
# ============================================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "CHANGE_ME"  # TODO: Replace with secure secret
ALGORITHM = "HS256"






# ============================================================
# GENERIC DB HELPERS
# ============================================================
async def commit_and_refresh(db: AsyncSession, instance):
    await db.commit()
    await db.refresh(instance)
    return instance


# ============================================================
# USER CRUD & AUTH
# ============================================================
async def get_user(db: AsyncSession, user_id: int) -> Optional[models.User]:
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[models.User]:
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, payload: schemas.UserCreate) -> models.User:
    user = models.User(
        username=payload.username,
        email=payload.email,
        role=payload.role or "User",
        hashed_password=pwd_context.hash(payload.password),
    )
    db.add(user)
    return await commit_and_refresh(db, user)

def create_audit_log(
    db: Session,
    role: str,
    action: str,
    details: str | None = None,
    ip_address: str | None = None,
    user_id: int | None = None,
    username: str | None = None,
):
    log = AuditLog(
        role=role,
        action=action,
        details=details,
        ip_address=ip_address,
        user_id=user_id,
        username=username,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

async def create_audit_log(db: AsyncSession, role: str, action: str, details: str = None, ip_address: str = None, user_id: int | None = None, username: str | None = None):
    log = AuditLog(
        role=role,
        action=action,
        details=details,
        ip_address=ip_address,
        user_id=user_id,
        username=username,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_audit_logs(db: AsyncSession):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc())
    )
    return result.scalars().all()
    
# -------------------------
# Authentication
# -------------------------
async def authenticate_user(db: AsyncSession, username: str, password: str):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        return None
    if not user.verify_password(password):  # or user.check_password
        return None
    if not user.is_active:  # optional: check if user is deactivated
        return None
    return user

# -------------------------
# Admin-only functions
# -------------------------
async def admin_create_user(db: AsyncSession, data: AdminCreateUser) -> Optional[User]:
    """Admin creates a new user with role. Returns None if user exists."""
    result = await db.execute(
        select(User).where(or_(User.username == data.username, User.email == data.email))
    )
    existing = result.scalars().first()
    if existing:
        return None

    user = User(
        username=data.username,
        email=data.email,
        role=data.role
    )
    user.set_password(data.password or "ChangeMe123")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def verify_admin(db: AsyncSession, username: str, password: str) -> tuple[bool, str]:
    """Verify if a user is an admin with correct password."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if not user:
        return False, "User not found"
    if user.role.strip().lower() != "admin":
        return False, "User is not an admin"
    if not pwd_context.verify(password, user.hashed_password):
        return False, "Invalid password"
    return True, "Verified successfully"

# -------------------------
# Password Reset
# -------------------------
def create_password_reset_token(email: str, expires_hours: int = 1) -> str:
    """Create JWT token for password reset."""
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(hours=expires_hours)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_password_reset_token(token: str) -> dict:
    """Verify JWT token for password reset."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

async def reset_user_password(db: AsyncSession, email: str, new_password: str) -> bool:
    """Reset user password given email. Returns False if user not found."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        return False
    user.set_password(new_password)
    await db.commit()
    await db.refresh(user)
    return True


# ============================================================
# PATIENT CRUD
# ============================================================
async def create_patient(db: AsyncSession, payload: schemas.PatientCreate) -> models.Patient:
    # 1️⃣ Check if a patient with the same first_name + last_name + date_of_birth already exists
    result = await db.execute(
        select(models.Patient).where(
            (models.Patient.first_name == payload.first_name) &
            (models.Patient.last_name == payload.last_name) &
            (models.Patient.dob == payload.dob)
        )
    )
    existing_patient = result.scalar_one_or_none()
    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient already exists")

    # 2️⃣ If not, create patient as usual
    patient = models.Patient(**payload.model_dump())
    db.add(patient)
    return await commit_and_refresh(db, patient)


async def get_patient(db: AsyncSession, patient_id: int) -> Optional[models.Patient]:
    result = await db.execute(select(models.Patient).where(models.Patient.id == patient_id))
    return result.scalar_one_or_none()


async def get_all_patients(db: AsyncSession) -> List[models.Patient]:
    result = await db.execute(select(models.Patient))
    return result.scalars().all()



async def update_patient(db: AsyncSession, patient_id: int, payload: schemas.PatientUpdate) -> Optional[models.Patient]:
    patient = await get_patient(db, patient_id)
    if not patient:
        return None

    # Check for potential duplicates if name or DOB is being updated
    updated_data = payload.model_dump(exclude_none=True)
    if any(field in updated_data for field in ["first_name", "last_name", "date_of_birth"]):
        new_first = updated_data.get("first_name", patient.first_name)
        new_last = updated_data.get("last_name", patient.last_name)
        new_dob = updated_data.get("dob", patient.dob)

        # Query for another patient with same name + DOB
        result = await db.execute(
            select(models.Patient).where(
                (models.Patient.first_name == new_first) &
                (models.Patient.last_name == new_last) &
                (models.Patient.dob == new_dob) &
                (models.Patient.id != patient_id)  # ignore current patient
            )
        )
        duplicate = result.scalar_one_or_none()
        if duplicate:
            raise HTTPException(status_code=400, detail="Another patient with this name and date of birth already exists")

    # Update patient fields
    for field, value in updated_data.items():
        setattr(patient, field, value)

    return await commit_and_refresh(db, patient)

async def delete_patient(db: AsyncSession, patient_id: int) -> bool:
    patient = await get_patient(db, patient_id)
    if not patient:
        return False
    await db.delete(patient)
    await db.commit()
    return True


# ============================================================
# LAB TEST CRUD
# ============================================================
async def create_lab_test(db: AsyncSession, payload: schemas.LabTestCreate) -> models.LabTest:
    test = models.LabTest(**payload.model_dump())
    db.add(test)
    return await commit_and_refresh(db, test)


async def get_lab_test(db: AsyncSession, test_id: int) -> Optional[models.LabTest]:
    result = await db.execute(select(models.LabTest).where(models.LabTest.id == test_id))
    return result.scalar_one_or_none()


async def get_all_lab_tests(db: AsyncSession) -> List[models.LabTest]:
    result = await db.execute(select(models.LabTest))
    return result.scalars().all()


async def delete_lab_test(db: AsyncSession, test_id: int) -> bool:
    test = await get_lab_test(db, test_id)
    if not test:
        return False
    await db.delete(test)
    await db.commit()
    return True


# ============================================================
# LAB REQUEST CRUD
# ============================================================

async def create_lab_request(
    db: AsyncSession,
    payload: schemas.LabRequestCreate
) -> models.LabRequest:
    lab_request = models.LabRequest(
        patient_id=payload.patient_id,
        status=payload.status or "Pending"
    )

    db.add(lab_request)
    await db.commit()
    await db.refresh(lab_request)

    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient),
        )
        .where(models.LabRequest.id == lab_request.id)
    )

    return result.scalar_one()


async def get_lab_request(
    db: AsyncSession,
    request_id: int
) -> Optional[models.LabRequest]:
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient),
        )
        .where(models.LabRequest.id == request_id)
    )

    return result.scalar_one_or_none()


async def get_all_lab_requests(
    db: AsyncSession
) -> List[models.LabRequest]:
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient),
        )
        .order_by(models.LabRequest.created_at.desc())
    )

    return result.scalars().unique().all()

# Update LabRequest
def update_lab_request(db: Session, request_id: int, updates: schemas.LabRequestUpdate):
    db_request = db.query(models.LabRequest).filter(models.LabRequest.id == request_id).first()
    if not db_request:
        return None
    if updates.comment is not None:
        db_request.comment = updates.comment
    if updates.status is not None:
        db_request.status = updates.status
    if updates.lab_test_ids is not None:
        # Update the lab_test_ids field if provided
        db_request.lab_test_ids = updates.lab_test_ids
    db.commit()
    db.refresh(db_request)
    return db_request


async def evaluate_lab_request_status(
    db: AsyncSession,
    request_id: int
) -> Optional[models.LabRequest]:
    request = await db.get(models.LabRequest, request_id)
    if not request:
        return None

    # Fetch all lab results for this request
    results = (
        await db.execute(
            select(models.LabResult).where(models.LabResult.lab_request_id == request_id)
        )
    ).scalars().all()

    if not results:
        # No results yet → Pending
        request.status = "Pending"
    else:
        # Count results that have actual content
        completed_count = sum(bool(r.results and str(r.results).strip()) for r in results)

        if completed_count == 0:
            request.status = "Pending"
        elif completed_count < len(results):
            request.status = "Partially Completed"
        else:
            request.status = "Completed"

    await db.commit()
    await db.refresh(request)
    return request
# ============================================================
# LAB RESULT CRUD
# ============================================================
async def create_lab_result(db: AsyncSession, data: schemas.LabResultCreate) -> models.LabResult:
    # 1️⃣ Check if a lab result already exists for this request and test
    result = await db.execute(
        select(models.LabResult).where(
            (models.LabResult.lab_request_id == data.lab_request_id) &
            (models.LabResult.lab_test_id == data.lab_test_id)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # 2️⃣ Update existing record
        existing.results = data.results
        existing.unit = data.unit
        existing.ref_range = data.ref_range
        existing.flag = data.flag
        existing.comment = data.comment
        await db.commit()
        await db.refresh(existing)

        # 4️⃣ Recalculate lab request status
        await evaluate_lab_request_status(db, data.lab_request_id)
        return existing

    # 3️⃣ Create new record
    new_result = models.LabResult(**data.model_dump())  # use model_dump for Pydantic 2+
    db.add(new_result)
    await db.commit()
    await db.refresh(new_result)

    # 4️⃣ Recalculate lab request status
    await evaluate_lab_request_status(db, data.lab_request_id)
    return new_result
async def get_all_lab_results(db: AsyncSession) -> List[models.LabResult]:
    result = await db.execute(select(models.LabResult).order_by(models.LabResult.created_at.desc()))
    return result.scalars().all()


async def get_lab_results_by_patient(db: AsyncSession, patient_id: int) -> List[models.LabResult]:
    result = await db.execute(
        select(models.LabResult)
        .where(models.LabResult.patient_id == patient_id)
        .order_by(models.LabResult.created_at.desc())
    )
    return result.scalars().all()


async def get_lab_test_results_by_request(db: AsyncSession, request_id: int):
    query = (
        select(
            models.LabResult.id,
            models.LabResult.lab_request_id,
            models.LabResult.lab_test_id,
             models.LabResult.patient_id,
             models.LabResult.results,
            models.LabResult.unit,
            models.LabResult.ref_range,
            models.LabResult.flag,
            models.LabResult.comment,
             models.LabResult.created_at,
            models.LabTest.name.label("test_name"),
           
        )
        .join(models.LabTest, models.LabTest.id == models.LabResult.lab_test_id)
        .where(models.LabResult.lab_request_id == request_id)
        .order_by(models.LabResult.id)
    )
    result = await db.execute(query)

    lab_results = []
    for row in result.all():
        lr = {
            "id": row.id,
            "lab_request_id": row.lab_request_id,
            "lab_test_id": row.lab_test_id,
             "patient_id": row.patient_id,
            "results": row.results,
            "unit": row.unit,
            "ref_range": row.ref_range,
            "flag": row.flag,
            "comment": row.comment,
             "created_at": row.created_at,
            "test_name": row.test_name,
            
        }
        lab_results.append(lr)

    return lab_results