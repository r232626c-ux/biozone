#!/usr/bin/env python3
"""
Restore Biozone database from JSON backup.
Usage: python restore_db.py backup_file.json
WARNING: This will overwrite existing data!
"""
import asyncio
import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()  # Load environment variables

from app.database import async_session, engine, Base
from app.models import User, Patient, LabTest, LabRequest, LabResult, PaymentCode, SystemSettings, AuditLog
from sqlalchemy import delete
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def restore_database(backup_file):
    with open(backup_file, 'r') as f:
        backup = json.load(f)

    if "tables" not in backup:
        print("Invalid backup format")
        return

    async with async_session() as db:
        # Clear existing data
        tables = {
            "audit_logs": AuditLog,
            "lab_results": LabResult,
            "lab_requests": LabRequest,
            "payment_codes": PaymentCode,
            "system_settings": SystemSettings,
            "patients": Patient,
            "lab_tests": LabTest,
            "users": User
        }

        for table_name, model in tables.items():
            await db.execute(delete(model))

        # Restore data
        for table_name, records in backup["tables"].items():
            if table_name == "users":
                for record in records:
                    if "password" in record and not record["password"].startswith("$2b$"):
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
        print("Data restored successfully")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_db.py backup_file.json")
        sys.exit(1)
    asyncio.run(restore_database(sys.argv[1]))