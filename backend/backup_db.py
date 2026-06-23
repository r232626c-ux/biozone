#!/usr/bin/env python3
"""
Backup Biozone database to JSON file.
Usage: python backup_db.py [output_file.json]
"""
import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()  # Load environment variables

from app.database import async_session
import os
print("DATABASE_URL:", os.getenv("DATABASE_URL"))
from app.models import User, Patient, LabTest, LabRequest, LabResult, PaymentCode, SystemSettings, AuditLog
from sqlalchemy import select

async def backup_database():
    async with async_session() as db:
        backup = {
            "timestamp": datetime.utcnow().isoformat(),
            "tables": {}
        }

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
            print(f"{table_name}: {len(records)} records")
            if records:
                print(f"Sample: {records[0].__dict__}")
            backup["tables"][table_name] = [{k: v for k, v in record.__dict__.items() if k != '_sa_instance_state'} for record in records]

        return backup

if __name__ == "__main__":
    output_file = sys.argv[1] if len(sys.argv) > 1 else "biozone_backup.json"
    backup = asyncio.run(backup_database())
    with open(output_file, 'w') as f:
        json.dump(backup, f, indent=2, default=str)