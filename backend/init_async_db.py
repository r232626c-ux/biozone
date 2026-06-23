"""
Run SQLAlchemy async metadata.create_all to create all tables in configured DATABASE_URL.
Usage: python init_async_db.py
"""
import asyncio

from app.database import init_db

if __name__ == "__main__":
    print("Starting async DB initialization...")
    asyncio.run(init_db())
    print("Async DB initialization complete.")
