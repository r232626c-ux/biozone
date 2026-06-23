#!/usr/bin/env python3
"""
Import lab results from backup JSON into the database.
"""
import asyncio
import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from dotenv import load_dotenv
load_dotenv()

from app.database import async_session
from app.crud import create_lab_result
from app.schemas import LabResultCreate
from sqlalchemy import select
from app.models import LabResult

async def import_backup_results(backup_file: str):
    """Import lab results from backup file"""

    # Load backup
    with open(backup_file, 'r') as f:
        backup = json.load(f)

    lab_results = backup['tables']['lab_results']
    print(f"Found {len(lab_results)} lab results in backup")

    imported = 0
    skipped = 0

    async with async_session() as db:
        for result_data in lab_results:
            # Check if result already exists
            existing = await db.execute(
                select(LabResult).where(
                    (LabResult.lab_request_id == result_data['lab_request_id']) &
                    (LabResult.lab_test_id == result_data['lab_test_id'])
                )
            )
            existing_result = existing.scalar_one_or_none()

            if existing_result:
                print(f"Skipping existing result: {result_data['test_name']} for request {result_data['lab_request_id']}")
                skipped += 1
                continue

            # Create new result
            try:
                result_create = LabResultCreate(
                    patient_id=result_data['patient_id'],
                    lab_request_id=result_data['lab_request_id'],
                    lab_test_id=result_data['lab_test_id'],
                    test_name=result_data['test_name'],
                    results=result_data['results'],
                    unit=result_data.get('unit', ''),
                    ref_range=result_data.get('ref_range', ''),
                    flag=result_data.get('flag', ''),
                    comment=result_data.get('comment', '')
                )

                await create_lab_result(db, result_create)
                print(f"Imported: {result_data['test_name']} = {result_data['results']}")
                imported += 1

            except Exception as e:
                print(f"Error importing {result_data['test_name']}: {e}")
                continue

    print(f"\nImport complete: {imported} imported, {skipped} skipped")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python import_backup.py <backup_file.json>")
        sys.exit(1)

    backup_file = sys.argv[1]
    asyncio.run(import_backup_results(backup_file))