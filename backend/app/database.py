# database.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables from .env
load_dotenv()

# Example .env (Postgres):
# DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/biozone

# If DATABASE_URL is not set, fall back to a local SQLite database for portability.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("WARNING: DATABASE_URL not found in environment variables!")
    print("   Falling back to SQLite database. Data may not persist properly.")
    # Use a local sqlite file in user's app data directory for persistence
    import os
    app_data_dir = Path(os.getenv('APPDATA', Path.home() / 'AppData' / 'Roaming')) / "Biozone"
    app_data_dir.mkdir(parents=True, exist_ok=True)
    sqlite_path = app_data_dir / "biozone.db"
    # Use SQLAlchemy async sqlite driver
    DATABASE_URL = f"sqlite+aiosqlite:///{sqlite_path.as_posix()}"
    print(f"Using SQLite database: {sqlite_path}")
elif "postgresql" in DATABASE_URL.lower():
    print("Using PostgreSQL database")
elif "sqlite" in DATABASE_URL.lower():
    print("WARNING: Using SQLite database - ensure data persistence!")
else:
    print(f"Unknown database type in DATABASE_URL: {DATABASE_URL}")

print(f"Database URL: {DATABASE_URL.replace('password', '****') if 'password' in DATABASE_URL else DATABASE_URL}")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,           # Set True for debugging SQL
    future=True,
    pool_pre_ping=True
)

# Session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# Alias for import convenience
async_session = AsyncSessionLocal

# Base class for models
Base = declarative_base()


# Dependency for FastAPI routes
async def get_db():
    """
    Provides an async database session for FastAPI endpoints.
    Ensures the session is properly closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Initialize database tables
async def init_db():
    """
    Creates all tables based on the models.
    Call this function at app startup if needed.
    """
    from app.models import Base  # adjust if your models are in a different file
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
