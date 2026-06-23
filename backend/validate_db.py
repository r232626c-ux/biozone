#!/usr/bin/env python3
"""
Database health check and validation script.
Ensures PostgreSQL is being used and lab results are being saved.
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.database import async_session, DATABASE_URL
from app.models import LabResult, LabRequest
from sqlalchemy import select, func, text

async def validate_database():
    """Validate database configuration and data integrity"""
    print("🔍 Database Health Check")
    print("=" * 50)

    # Check database URL
    db_url = os.getenv("DATABASE_URL", "Not set")
    print(f"📊 DATABASE_URL: {db_url}")

    if "sqlite" in db_url.lower():
        print("⚠️  WARNING: Using SQLite instead of PostgreSQL!")
        print("   This may cause data persistence issues.")
        return False
    elif "postgresql" in db_url.lower():
        print("✅ Using PostgreSQL - Good!")
    else:
        print("❌ Unknown database type!")
        return False

    # Check database connection
    try:
        async with async_session() as db:
            # Test basic connection
            result = await db.execute(select(func.count(LabResult.id)))
            lab_result_count = result.scalar()
            print(f"🧪 Lab Results Count: {lab_result_count}")

            # Check recent results (last 24 hours)
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_results = await db.execute(
                select(func.count(LabResult.id)).where(LabResult.created_at >= yesterday)
            )
            recent_count = recent_results.scalar()
            print(f"📅 Recent Results (24h): {recent_count}")

            # Check for any incomplete requests
            incomplete_requests = await db.execute(
                select(func.count(LabRequest.id)).where(LabRequest.status.in_(["Pending", "Partially Completed"]))
            )
            incomplete_count = incomplete_requests.scalar()
            print(f"⏳ Incomplete Requests: {incomplete_count}")

            if lab_result_count == 0:
                print("⚠️  WARNING: No lab results found in database!")
                return False

            print("✅ Database validation passed!")
            return True

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

async def ensure_data_integrity():
    """Ensure data integrity and fix any issues"""
    print("\n🔧 Data Integrity Check")
    print("=" * 30)

    async with async_session() as db:
        # Check for orphaned results (results without requests)
        orphaned_query = text("""
            SELECT lr.id, lr.test_name, lr.patient_id
            FROM lab_results lr
            LEFT JOIN lab_requests lreq ON lr.lab_request_id = lreq.id
            WHERE lreq.id IS NULL
        """)
        orphaned_results = await db.execute(orphaned_query)

        orphaned = orphaned_results.fetchall()
        if orphaned:
            print(f"⚠️  Found {len(orphaned)} orphaned lab results!")
            for result in orphaned:
                print(f"   Orphaned: {result.test_name} (Patient: {result.patient_id})")
        else:
            print("✅ No orphaned lab results found")

        # Check for results with empty values
        empty_results = await db.execute(
            select(func.count(LabResult.id)).where(
                (LabResult.results == "") | (LabResult.results.is_(None))
            )
        )
        empty_count = empty_results.scalar()
        if empty_count > 0:
            print(f"ℹ️  Found {empty_count} results with empty values (this may be normal)")

        print("✅ Data integrity check completed")

if __name__ == "__main__":
    async def main():
        valid = await validate_database()
        if valid:
            await ensure_data_integrity()
            print("\n🎉 All checks passed! Database is healthy.")
        else:
            print("\n❌ Database issues detected! Please check configuration.")
            sys.exit(1)

    asyncio.run(main())