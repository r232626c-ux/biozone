"""
Configuration file for BIOZONE Lab System
Manage payment codes, system settings, and environment variables
"""
import os
import hmac
from datetime import datetime

# ==============================
# PAYMENT CONFIGURATION
# ==============================

# Payment verification code - Change this to your actual code
# This is the code customers must enter to verify their payment
VALID_PAYMENT_CODE = os.getenv("PAYMENT_CODE", "").strip().upper()
SUBSCRIPTION_UNLOCK_CODE = os.getenv("SUBSCRIPTION_UNLOCK_CODE", "").strip().upper()

# Additional codes for specific licenses (optional)
# Format: {"LICENSE_NAME": "CODE"}
ADDITIONAL_PAYMENT_CODES = {
    # Configure additional codes through the database payment-code workflow.
}

# ==============================
# SYSTEM CONFIGURATION
# ==============================

# Default lab name
DEFAULT_LAB_NAME = "BIOZONE Lab"

# Default turnaround time in hours
DEFAULT_TURNAROUND_TIME = "24"

# Default data retention period in days
DEFAULT_DATA_RETENTION_DAYS = 365

# ==============================
# API CONFIGURATION
# ==============================

API_VERSION = "1.0.0"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
SECRET_KEY = os.getenv("SECRET_KEY", "SUPERSECRETKEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ==============================
# PAYMENT CODE MANAGEMENT FUNCTIONS
# ==============================

def is_valid_payment_code(code: str) -> bool:
    """
    Check if the provided code is a valid payment code
    
    Args:
        code: Payment verification code entered by user
    
    Returns:
        bool: True if code is valid, False otherwise
    """
    code = code.strip().upper()
    if any(
        configured and hmac.compare_digest(code, configured)
        for configured in (VALID_PAYMENT_CODE, SUBSCRIPTION_UNLOCK_CODE)
    ):
        return True

    if any(
        hmac.compare_digest(code, configured)
        for configured in ADDITIONAL_PAYMENT_CODES.values()
        if configured
    ):
        return True
    
    return False


def get_code_license_type(code: str) -> str:
    """
    Get the license type for a given code
    
    Args:
        code: Payment verification code
    
    Returns:
        str: License type (STANDARD, DEMO, ENTERPRISE) or "UNKNOWN"
    """
    code = code.strip().upper()
    if VALID_PAYMENT_CODE and hmac.compare_digest(code, VALID_PAYMENT_CODE):
        return "STANDARD"
    if SUBSCRIPTION_UNLOCK_CODE and hmac.compare_digest(code, SUBSCRIPTION_UNLOCK_CODE):
        return "STANDARD"
    
    for license_type, license_code in ADDITIONAL_PAYMENT_CODES.items():
        if license_code and hmac.compare_digest(code, license_code):
            return license_type
    
    return "UNKNOWN"


def generate_payment_code(license_type: str = "STANDARD") -> str:
    """
    Generate a new payment code (for admin use)
    
    Args:
        license_type: Type of license (STANDARD, DEMO, ENTERPRISE)
    
    Returns:
        str: Generated code in format BIOZONE_TYPE_TIMESTAMP
    """
    timestamp = datetime.now().strftime("%Y%m%d")
    return f"BIOZONE_{license_type}_{timestamp}"


# ==============================
# USAGE EXAMPLE
# ==============================
"""
In main.py, import and use:

from app.config import (
    is_valid_payment_code,
    get_code_license_type,
)

Then in the verify_payment endpoint:
if is_valid_payment_code(payment_req.code.strip()):
    license_type = get_code_license_type(payment_req.code)
    # ... proceed with verification
"""
