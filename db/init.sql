CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  full_name TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE,
  medical_record_number TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS lab_tests (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  requested_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'Pending',
  file_number TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS request_tests (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
  lab_test_id INTEGER REFERENCES lab_tests(id),
  result TEXT,
  status TEXT DEFAULT 'Pending'
);

-- seed
INSERT INTO users (username, role, full_name) VALUES
('admin','admin','System Admin')
ON CONFLICT DO NOTHING;

INSERT INTO lab_tests (code,name,category,price) VALUES
('FBC','Full Blood Count','Hematology',12.50) ON CONFLICT DO NOTHING,
('BMP','Basic Metabolic Panel','Chemistry',20.00) ON CONFLICT DO NOTHING,
('CA15-3','CA15-3 Tumor Marker','Tumor Markers',45.00) ON CONFLICT DO NOTHING;
