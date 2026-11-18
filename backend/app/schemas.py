from pydantic import BaseModel, EmailStr, Field, RootModel
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


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


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
    must_change_password: bool = False

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


class EmailSentAuditEvent(BaseModel):
    recipients: List[EmailStr]


# ================= PATIENT =================
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    facility: Optional[str] = None
    funding: Optional[str] = None
    member_number: Optional[str] = None
    member_suffix: Optional[str] = None
    relationship: Optional[str] = None
    principal: Optional[bool] = True
    doctor_name: Optional[str] = None
    ah_foz: Optional[str] = None
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


class PatientVisitOut(BaseModel):
    id: int
    status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PatientSearchOut(PatientOut):
    lab_requests: List[PatientVisitOut] = Field(default_factory=list)


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
    patient_id: Optional[int] = None
    id: int
    created_at: datetime
    sample_date: Optional[datetime] = None
    patient: Optional[PatientOut] = None

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


class LabResultListOut(LabResultRead):
    category: Optional[str] = None
    patient_first_name: Optional[str] = None
    patient_last_name: Optional[str] = None
    request_created_at: Optional[datetime] = None
    request_status: Optional[str] = None


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
    labname: Optional[str] = Field(default="BIOZONE Lab", alias="labName")
    turnaroundtime: Optional[str] = Field(default="24", alias="turnaroundTime")
    enablenotifications: Optional[bool] = Field(default=True, alias="enableNotifications")
    maintenancemode: Optional[bool] = Field(default=False, alias="maintenanceMode")
    defaultreportformat: Optional[str] = Field(default="PDF", alias="defaultReportFormat")
    dataretentiondays: Optional[int] = Field(default=365, alias="dataRetentionDays")

    class Config:
        from_attributes = True
        populate_by_name = True


class SystemSettingsCreate(SystemSettingsBase):
    pass


class SystemSettingsOut(SystemSettingsBase):
    id: int
    lastpaymentdate: Optional[datetime] = Field(default=None, alias="lastPaymentDate")
    paymentstatus: str = Field(default="inactive", alias="paymentStatus")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


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

