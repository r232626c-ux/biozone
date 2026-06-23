"""
Payment codes generation script for BIOZONE Lab 2026
Generates unique payment codes for each 2-month period
"""
import secrets
import string
from datetime import date
from typing import List


def generate_code(period: str, license_type: str = "STANDARD") -> str:
    """
    Generate a unique payment code with format:
    BZ-PERIOD-XXXXXXXXXXXX
    
    Example: BZ-FEB2026-A7K9M2P5L1X3
    """
    # Generate 12 random alphanumeric characters
    random_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) 
                           for _ in range(12))
    return f"BZ-{period.upper()}-{random_suffix}"


def generate_2026_codes() -> List[dict]:
    """
    Generate payment codes for each 2-month period in 2026
    Starting from February 2026 to December 2026 (6 periods)
    """
    codes = []
    
    # Period definitions for 2026
    periods = [
        {
            "period_name": "FEB-MAR-2026",
            "valid_from": date(2026, 2, 1),
            "valid_until": date(2026, 3, 31),
            "description": "Q1 2026 License (Feb-Mar)"
        },
        {
            "period_name": "APR-MAY-2026",
            "valid_from": date(2026, 4, 1),
            "valid_until": date(2026, 5, 31),
            "description": "Q2 First Half 2026 License (Apr-May)"
        },
        {
            "period_name": "JUN-JUL-2026",
            "valid_from": date(2026, 6, 1),
            "valid_until": date(2026, 7, 31),
            "description": "Q2 Second Half 2026 License (Jun-Jul)"
        },
        {
            "period_name": "AUG-SEP-2026",
            "valid_from": date(2026, 8, 1),
            "valid_until": date(2026, 9, 30),
            "description": "Q3 2026 License (Aug-Sep)"
        },
        {
            "period_name": "OCT-NOV-2026",
            "valid_from": date(2026, 10, 1),
            "valid_until": date(2026, 11, 30),
            "description": "Q4 First Half 2026 License (Oct-Nov)"
        },
        {
            "period_name": "DEC-2026",
            "valid_from": date(2026, 12, 1),
            "valid_until": date(2026, 12, 31),
            "description": "Q4 Final Month 2026 License (Dec)"
        },
    ]
    
    for period_info in periods:
        code = generate_code(period_info["period_name"])
        
        codes.append({
            "code": code,
            "period": period_info["period_name"],
            "validFrom": period_info["valid_from"],
            "validUntil": period_info["valid_until"],
            "licenseType": "STANDARD",
            "description": period_info["description"]
        })
    
    return codes


def print_codes_table(codes: List[dict]):
    """Print codes in a readable table format"""
    print("\n" + "="*100)
    print("BIOZONE LAB 2026 PAYMENT CODES")
    print("="*100)
    print(f"{'Code':<35} {'Period':<15} {'Valid From':<12} {'Valid Until':<12} {'Type':<10}")
    print("-"*100)
    
    for code in codes:
        print(f"{code['code']:<35} {code['period']:<15} {str(code['validFrom']):<12} {str(code['validUntil']):<12} {code['licenseType']:<10}")
    
    print("="*100)
    print(f"Total codes generated: {len(codes)}")
    print("="*100 + "\n")


def get_codes_as_json() -> str:
    """Return codes as JSON string for API"""
    import json
    codes = generate_2026_codes()
    return json.dumps(codes, default=str, indent=2)


def get_codes_as_sql() -> str:
    """Generate SQL INSERT statements"""
    codes = generate_2026_codes()
    sql = "-- Payment Codes for BIOZONE Lab 2026\n"
    sql += "-- Insert into payment_codes table\n\n"
    
    for code in codes:
        sql += f"""INSERT INTO payment_codes (code, period, validFrom, validUntil, licenseType, description, isUsed, created_at, updated_at)
VALUES (
    '{code['code']}',
    '{code['period']}',
    '{code['validFrom']}',
    '{code['validUntil']}',
    '{code['licenseType']}',
    '{code['description']}',
    0,
    datetime('now'),
    datetime('now')
);\n\n"""
    
    return sql


# Generate and display codes
if __name__ == "__main__":
    codes = generate_2026_codes()
    
    # Print readable table
    print_codes_table(codes)
    
    # Print JSON format
    print("\nJSON Format (for API):")
    print("-" * 50)
    print(get_codes_as_json())
    
    # Print SQL format
    print("\n\nSQL Format (for database insertion):")
    print("-" * 50)
    print(get_codes_as_sql())
