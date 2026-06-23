"""
Simple script to populate payment codes into the database using raw SQL
Run this to insert all 6 payment codes for 2026
"""
import os
import psycopg2
from datetime import date
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def populate_payment_codes_2026():
    """Populate all 2026 payment codes into database using raw SQL"""
    
    # Get database URL from environment
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ DATABASE_URL not found in .env file")
        return False
    
    # Parse PostgreSQL URL
    # Format: postgresql+asyncpg://user:password@host:port/dbname
    # Convert to psycopg2 format: postgresql://user:password@host:port/dbname
    db_url_sync = db_url.replace("+asyncpg", "")
    
    # Payment codes for 2026 (6 periods of 2 months each)
    codes_data = [
        {
            "code": "BZ-FEB2026-A7K9M2P5L1X3",
            "period": "FEB-MAR-2026",
            "validFrom": "2026-02-01",
            "validUntil": "2026-03-31",
            "licenseType": "STANDARD",
            "description": "Q1 2026 License (Feb-Mar)"
        },
        {
            "code": "BZ-APR2026-K4T8N1Q6R9S2",
            "period": "APR-MAY-2026",
            "validFrom": "2026-04-01",
            "validUntil": "2026-05-31",
            "licenseType": "STANDARD",
            "description": "Q2 First Half 2026 License (Apr-May)"
        },
        {
            "code": "BZ-JUN2026-P7L2M5X8Z3V1",
            "period": "JUN-JUL-2026",
            "validFrom": "2026-06-01",
            "validUntil": "2026-07-31",
            "licenseType": "STANDARD",
            "description": "Q2 Second Half 2026 License (Jun-Jul)"
        },
        {
            "code": "BZ-AUG2026-J9H4T6N1K8L5",
            "period": "AUG-SEP-2026",
            "validFrom": "2026-08-01",
            "validUntil": "2026-09-30",
            "licenseType": "STANDARD",
            "description": "Q3 2026 License (Aug-Sep)"
        },
        {
            "code": "BZ-OCT2026-W2D5F7G9J3M8",
            "period": "OCT-NOV-2026",
            "validFrom": "2026-10-01",
            "validUntil": "2026-11-30",
            "licenseType": "STANDARD",
            "description": "Q4 First Half 2026 License (Oct-Nov)"
        },
        {
            "code": "BZ-DEC2026-C6B1P4V8K2X9",
            "period": "DEC-2026",
            "validFrom": "2026-12-01",
            "validUntil": "2026-12-31",
            "licenseType": "STANDARD",
            "description": "Q4 Final Month 2026 License (Dec)"
        },
    ]
    
    try:
        # Connect to database
        print(f"🔌 Connecting to database...")
        conn = psycopg2.connect(db_url_sync)
        cursor = conn.cursor()
        
        # Create payment_codes table if not exists
        print("📋 Creating payment_codes table (if not exists)...")
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS payment_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR UNIQUE NOT NULL,
            validFrom DATE NOT NULL,
            validUntil DATE NOT NULL,
            period VARCHAR NOT NULL,
            licenseType VARCHAR DEFAULT 'STANDARD',
            isUsed BOOLEAN DEFAULT FALSE,
            usedDate TIMESTAMP,
            description VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_table_sql)
        conn.commit()
        print("✓ Table created (or already exists)")
        
        # Create index on code column
        print("📊 Creating index on code column...")
        create_index_sql = """
        CREATE INDEX IF NOT EXISTS idx_payment_code 
        ON payment_codes(code);
        """
        cursor.execute(create_index_sql)
        conn.commit()
        print("✓ Index created (or already exists)")
        
        # Check existing codes
        print("\n🔍 Checking existing codes...")
        cursor.execute("SELECT COUNT(*) FROM payment_codes;")
        existing_count = cursor.fetchone()[0]
        
        if existing_count > 0:
            print(f"⚠️  Database already has {existing_count} payment codes")
            response = input("Do you want to continue adding codes? (y/n): ")
            if response.lower() != 'y':
                print("❌ Aborted.")
                cursor.close()
                conn.close()
                return False
        
        # Insert codes
        print("\n📥 Inserting payment codes...\n")
        codes_added = 0
        codes_skipped = 0
        
        for code_data in codes_data:
            # Check if code already exists
            cursor.execute(
                "SELECT id FROM payment_codes WHERE code = %s;",
                (code_data["code"],)
            )
            existing = cursor.fetchone()
            
            if existing:
                print(f"⊘ Code already exists: {code_data['code']} ({code_data['period']})")
                codes_skipped += 1
                continue
            
            # Insert new code
            insert_sql = """
            INSERT INTO payment_codes 
            (code, period, validFrom, validUntil, licenseType, description, isUsed)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
            """
            
            cursor.execute(insert_sql, (
                code_data["code"],
                code_data["period"],
                code_data["validFrom"],
                code_data["validUntil"],
                code_data["licenseType"],
                code_data["description"],
                False
            ))
            conn.commit()
            
            print(f"✓ Added: {code_data['code']} ({code_data['period']})")
            print(f"  Valid: {code_data['validFrom']} to {code_data['validUntil']}")
            codes_added += 1
        
        # Display summary
        cursor.execute("SELECT COUNT(*) FROM payment_codes;")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM payment_codes WHERE isUsed = FALSE;")
        unused = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM payment_codes WHERE isUsed = TRUE;")
        used = cursor.fetchone()[0]
        
        print("\n" + "="*60)
        print("✅ PAYMENT CODES POPULATED SUCCESSFULLY!")
        print("="*60)
        print(f"Codes Added:     {codes_added}")
        print(f"Codes Skipped:   {codes_skipped}")
        print(f"Total in DB:     {total}")
        print(f"Unused Codes:    {unused}")
        print(f"Used Codes:      {used}")
        print("="*60 + "\n")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("BIOZONE LAB 2026 - PAYMENT CODES SETUP")
    print("="*60 + "\n")
    
    success = populate_payment_codes_2026()
    
    if success:
        print("\n📌 NEXT STEPS:")
        print("1. ✓ Payment codes are now in the database")
        print("2. Distribute payment codes to customers based on current period:")
        print("   • Feb-Mar 2026: BZ-FEB2026-A7K9M2P5L1X3")
        print("   • Apr-May 2026: BZ-APR2026-K4T8N1Q6R9S2")
        print("   • Jun-Jul 2026: BZ-JUN2026-P7L2M5X8Z3V1")
        print("   • Aug-Sep 2026: BZ-AUG2026-J9H4T6N1K8L5")
        print("   • Oct-Nov 2026: BZ-OCT2026-W2D5F7G9J3M8")
        print("   • Dec-2026:     BZ-DEC2026-C6B1P4V8K2X9")
        print("3. Customers can now enter codes in Settings > Payment Verification")
        print("4. System verifies codes against database")
        print("5. Each code can only be used once and is marked as 'Used'")
        print("\n")
    else:
        print("❌ Setup failed. Check your .env file and database connection.")
        print("\n")
