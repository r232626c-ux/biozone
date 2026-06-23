"""
Add missing audit log columns (user_id, username) to audit_logs table if they don't exist.
Run: python migrate_add_audit_columns.py
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("DATABASE_URL not set in .env")
    raise SystemExit(1)

# Convert async url to sync if needed
DB_URL_SYNC = DB_URL.replace("+asyncpg", "")

sqls = [
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS username VARCHAR;",
]

try:
    conn = psycopg2.connect(DB_URL_SYNC)
    cur = conn.cursor()
    for s in sqls:
        cur.execute(s)
    conn.commit()
    cur.close()
    conn.close()
    print("✅ audit_logs table updated (user_id, username added if missing)")
except Exception as e:
    print(f"❌ Failed to migrate audit_logs table: {e}")
    raise
