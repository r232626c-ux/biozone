#!/usr/bin/env python3
"""
Daily backup script for Biozone database.
Run this daily to backup all data including lab results.
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
import sys
import os

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.database import async_session
from app.models import User, Patient, LabTest, LabRequest, LabResult, PaymentCode, SystemSettings, AuditLog
from sqlalchemy import select

async def daily_backup():
    """Create daily backup of all database tables"""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path(__file__).parent / "backups"
    backup_dir.mkdir(exist_ok=True)

    backup_file = backup_dir / f"daily_backup_{timestamp}.json"

    async with async_session() as db:
        backup = {
            "timestamp": datetime.utcnow().isoformat(),
            "database_url": os.getenv("DATABASE_URL", "unknown"),
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

        total_records = 0
        for table_name, model in tables.items():
            result = await db.execute(select(model))
            records = result.scalars().all()
            total_records += len(records)
            print(f"{table_name}: {len(records)} records")
            backup["tables"][table_name] = [
                {k: v for k, v in record.__dict__.items() if k != '_sa_instance_state'}
                for record in records
            ]

        # Save backup
        with open(backup_file, 'w') as f:
            json.dump(backup, f, indent=2, default=str)

        print(f"\n✅ Daily backup completed: {backup_file}")
        print(f"📊 Total records backed up: {total_records}")
        print(f"🧪 Lab results: {len(backup['tables']['lab_results'])}")

        # Clean up old backups (keep last 30 days)
        cleanup_old_backups(backup_dir)

        return backup_file

def cleanup_old_backups(backup_dir: Path):
    """Keep only the last 30 daily backups"""
    backup_files = list(backup_dir.glob("daily_backup_*.json"))
    backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)

    if len(backup_files) > 30:
        for old_file in backup_files[30:]:
            old_file.unlink()
            print(f"🗑️ Removed old backup: {old_file.name}")

if __name__ == "__main__":
    print("🚀 Starting daily backup...")
    asyncio.run(daily_backup())
    print("✅ Daily backup completed successfully!")