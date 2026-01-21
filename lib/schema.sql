-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_num VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_person_id ON invoices(person_id);
CREATE INDEX IF NOT EXISTS idx_invoice_num ON invoices(invoice_num);
