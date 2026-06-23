# out of data not in use

# update_patient_requests.py

#import sqlite3

# 1. Connect to SQLite database
#DATABASE_PATH = "biozone.db"  # Change to your DB path
#conn = sqlite3.connect(DATABASE_PATH)
#cursor = conn.cursor()

# 2. Define the columns you want to ensure exist
#required_columns = {
#    "file_number": "TEXT",
#    "verified": "INTEGER DEFAULT 0"
#}

# 3. Get existing columns in the table
#cursor.execute("PRAGMA table_info(patient_requests);")
#existing_columns = [row[1] for row in cursor.fetchall()]

# 4. Add missing columns
#for column_name, column_type in required_columns.items():
#    if column_name not in existing_columns:
#        sql = f"ALTER TABLE patient_requests ADD COLUMN {column_name} {column_type};"
#        print(f"Adding missing column: {column_name}")
#        cursor.execute(sql)

#conn.commit()
#conn.close()
#print("Table updated successfully!")
