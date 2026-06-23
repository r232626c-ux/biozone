from pydantic import BaseModel, EmailStr, RootModel
from typing import List, Optional, Dict
from datetime import datetime


# ================= USER =================
class UserBase(BaseModel):
    username: str
    role: str


class UserCreate(UserBase):
    password: str
    email: Optional[str] = None
    role: Optional[str] = None


class AdminCreateUser(BaseModel):
    username: str
    email: EmailStr
    password: Optional[str] = None
    role: str  # Must explicitly define role

class UserOut(UserBase):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class PermissionsResponse(BaseModel):
    role: str
    permissions: List[str]

class PermissionsUpdate(BaseModel):
    permissions: Dict[str, List[str]]


class AuditLogOut(BaseModel):
    id: int
    role: str
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    user_id: Optional[int]
    username: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ================= PATIENT =================
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    facility: Optional[str] = None
    funding: Optional[str] = None
    member_number: Optional[str] = None
    member_suffix: Optional[str] = None
    doctor_name: Optional[str] = None
    clinical_data: Optional[str] = None
    request_id: Optional[int] = None
    sample_date: Optional[str] = None
    


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    pass


class PatientOut(PatientBase):
    id: int

    class Config:
        from_attributes = True


# ================= LAB TEST =================
class LabTestBase(BaseModel):
    name: str
    category: str


class LabTestCreate(LabTestBase):
    pass


class LabTestOut(LabTestBase):
    id: int

    class Config:
        from_attributes = True


# ================= LAB REQUEST =================
class LabRequestBase(BaseModel):
    patient_id: int
    status: Optional[str] = "Pending"


class LabRequestCreate(LabRequestBase):
    lab_test_ids: List[int]


class LabResultOut(BaseModel):
    id: int
    test_name: str
    results: Optional[str]
    lab_test: LabTestOut

    class Config:
        from_attributes = True


class LabRequestOut(LabRequestBase):
    id: int
    created_at: datetime
    sample_date: Optional[datetime] = None
    patient: PatientOut

    class Config:
        from_attributes = True


# ================= LAB RESULT =================
class LabResultCreate(BaseModel):
    patient_id: int
    lab_request_id: int
    lab_test_id: int
    test_name: str
    results: Optional[str] = None
    unit: Optional[str] = None
    ref_range: Optional[str] = None
    flag: Optional[str] = None
    comment: Optional[str] = None


class LabResultSave(BaseModel):
    patient_id: int
    lab_request_id: int
    lab_test_id: int
    test_name: str
    results: Optional[str] = None
    unit: Optional[str] = None
    ref_range: Optional[str] = None
    flag: Optional[str] = None
    comment: Optional[str] = None


class LabRequestUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    lab_test_ids: Optional[List[int]] = None

class LabResultRead(BaseModel):
    id: int
    patient_id: int
    lab_test_id: int
    lab_request_id: int
    test_name: str
    results: Optional[str]
    unit: Optional[str] = None
    ref_range: Optional[str] = None
    flag: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class AdminCreateUser(BaseModel):
    username: str
    password: str
    email: EmailStr
    role: str

class AdminVerifyRequest(BaseModel):
    username: str
    password: str

class AdminVerifyResponse(BaseModel):
    verified: bool
    msg: str = ""


# ================= SYSTEM SETTINGS =================
class SystemSettingsBase(BaseModel):
    labName: Optional[str] = "BIOZONE Lab"
    turnaroundTime: Optional[str] = "24"
    enableNotifications: Optional[bool] = True
    maintenanceMode: Optional[bool] = False
    defaultReportFormat: Optional[str] = "PDF"
    dataRetentionDays: Optional[int] = 365


class SystemSettingsCreate(SystemSettingsBase):
    pass


class SystemSettingsOut(SystemSettingsBase):
    id: int
    lastPaymentDate: Optional[datetime] = None
    paymentStatus: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentVerificationRequest(BaseModel):
    code: str


from datetime import date

class PaymentVerificationResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    lastPaymentDate: Optional[datetime] = None


# ================= PAYMENT CODE =================
class PaymentCodeBase(BaseModel):
    code: str
    validfrom: date
    validuntil: date
    period: str
    licensetype: Optional[str] = "STANDARD"
    description: Optional[str] = None


class PaymentCodeCreate(PaymentCodeBase):
    pass


class PaymentCodeOut(PaymentCodeBase):
    id: int
    isused: bool
    useddate: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentCodesList(BaseModel):
    codes: List[PaymentCodeOut]
    total: int
    active: int
    used: int

