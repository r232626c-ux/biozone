"""
Script to populate payment codes into the database
Run this after generating codes with generate_payment_codes_2026.py
"""
import asyncio
import sys
from datetime import datetime, date

# Add parent directory to path
sys.path.insert(0, '/path/to/backend')

from app.database import AsyncSessionLocal, engine
from app.models import Base, PaymentCode


async def populate_payment_codes_2026():
    """Populate all 2026 payment codes into database"""
    
    # Create tables first
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as db:
        # Payment codes for 2026 (6 periods of 2 months each)
        codes_data = [
            {
                "code": "BZ-FEB2026-A7K9M2P5L1X3",
                "period": "FEB-MAR-2026",
                "validFrom": date(2026, 2, 1),
                "validUntil": date(2026, 3, 31),
                "licenseType": "STANDARD",
                "description": "Q1 2026 License (Feb-Mar)"
            },
            {
                "code": "BZ-APR2026-K4T8N1Q6R9S2",
                "period": "APR-MAY-2026",
                "validFrom": date(2026, 4, 1),
                "validUntil": date(2026, 5, 31),
                "licenseType": "STANDARD",
                "description": "Q2 First Half 2026 License (Apr-May)"
            },
            {
                "code": "BZ-JUN2026-P7L2M5X8Z3V1",
                "period": "JUN-JUL-2026",
                "validFrom": date(2026, 6, 1),
                "validUntil": date(2026, 7, 31),
                "licenseType": "STANDARD",
                "description": "Q2 Second Half 2026 License (Jun-Jul)"
            },
            {
                "code": "BZ-AUG2026-J9H4T6N1K8L5",
                "period": "AUG-SEP-2026",
                "validFrom": date(2026, 8, 1),
                "validUntil": date(2026, 9, 30),
                "licenseType": "STANDARD",
                "description": "Q3 2026 License (Aug-Sep)"
            },
            {
                "code": "BZ-OCT2026-W2D5F7G9J3M8",
                "period": "OCT-NOV-2026",
                "validFrom": date(2026, 10, 1),
                "validUntil": date(2026, 11, 30),
                "licenseType": "STANDARD",
                "description": "Q4 First Half 2026 License (Oct-Nov)"
            },
            {
                "code": "BZ-DEC2026-C6B1P4V8K2X9",
                "period": "DEC-2026",
                "validFrom": date(2026, 12, 1),
                "validUntil": date(2026, 12, 31),
                "licenseType": "STANDARD",
                "description": "Q4 Final Month 2026 License (Dec)"
            },
        ]
        
        try:
            # Import for async query
            from sqlalchemy import select, func
            
            # Check if codes already exist
            result = await db.execute(select(func.count(PaymentCode.id)))
            existing_count = result.scalar()
            
            if existing_count > 0:
                print(f"⚠️  Database already has {existing_count} payment codes")
                response = input("Do you want to add more codes? (y/n): ")
                if response.lower() != 'y':
                    print("Aborted.")
                    return False
            
            # Insert all codes
            for code_data in codes_data:
                # Check if code already exists
                result = await db.execute(
                    select(PaymentCode).where(PaymentCode.code == code_data["code"])
                )
                existing = result.scalar()
                
                if existing:
                    print(f"✓ Code already exists: {code_data['code']} ({code_data['period']})")
                    continue
                
                payment_code = PaymentCode(
                    code=code_data["code"],
                    period=code_data["period"],
                    validFrom=code_data["validFrom"],
                    validUntil=code_data["validUntil"],
                    licenseType=code_data["licenseType"],
                    description=code_data["description"],
                    isUsed=False
                )
                
                db.add(payment_code)
                print(f"✓ Added: {code_data['code']} ({code_data['period']}) - Valid from {code_data['validFrom']} to {code_data['validUntil']}")
            
            await db.commit()
            
            # Display summary
            result = await db.execute(select(func.count(PaymentCode.id)))
            total = result.scalar()
            
            result = await db.execute(select(func.count(PaymentCode.id)).where(PaymentCode.isUsed == False))
            unused = result.scalar()
            
            result = await db.execute(select(func.count(PaymentCode.id)).where(PaymentCode.isUsed == True))
            used = result.scalar()
            
            print("\n" + "="*60)
            print("✅ Payment codes populated successfully!")
            print("="*60)
            print(f"Total codes in database: {total}")
            print(f"Unused codes: {unused}")
            print(f"Used codes: {used}")
            print("="*60 + "\n")
            
            return True
            
        except Exception as e:
            print(f"❌ Error populating payment codes: {e}")
            await db.rollback()
            return False


async def main():
    print("\n" + "="*60)
    print("BIOZONE LAB 2026 - PAYMENT CODES SETUP")
    print("="*60 + "\n")
    
    success = await populate_payment_codes_2026()
    
    if success:
        print("\n📌 Next steps:")
        print("1. Distribute payment codes to customers")
        print("2. Customers can now enter codes in Settings")
        print("3. System will verify against database codes")
        print("4. Each code can only be used once and is marked as 'Used'")
        print("\n")

if __name__ == "__main__":
    asyncio.run(main())