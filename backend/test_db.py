from sqlalchemy import create_engine, text

DB_USER = "SA"
DB_PASSWORD = "@30August2024"
DB_SERVER = "127.0.0.1"
DB_PORT = "1433"
DB_NAME = "biozone_db"

connection_string = (
    f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER},{DB_PORT}/{DB_NAME}"
    "?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no"
)

engine = create_engine(connection_string, echo=True, pool_pre_ping=True)

# Test Connection
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT @@VERSION")).fetchone()
        print("✅ Connected successfully!")
        print(result)
except Exception as e:
    print("❌ Connection failed:", e)


