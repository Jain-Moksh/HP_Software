-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS transactions_out CASCADE;
DROP TABLE IF EXISTS transactions_in CASCADE;
DROP TABLE IF EXISTS jobbers CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Master Tables
CREATE TABLE jobbers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Tables
CREATE TABLE transactions_in (
    id SERIAL PRIMARY KEY,
    jobber_id INTEGER REFERENCES jobbers(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
    type1 NUMERIC DEFAULT 0,
    type2 NUMERIC DEFAULT 0,
    material VARCHAR(255),
    rate NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    date DATE NOT NULL,
    remark TEXT,
    w BOOLEAN DEFAULT false,
    b BOOLEAN DEFAULT false,
    a BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions_out (
    id SERIAL PRIMARY KEY,
    jobber_id INTEGER REFERENCES jobbers(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    type1 NUMERIC DEFAULT 0,
    type2 NUMERIC DEFAULT 0,
    material VARCHAR(255),
    rate NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    date DATE NOT NULL,
    remark TEXT,
    w BOOLEAN DEFAULT false,
    b BOOLEAN DEFAULT false,
    a BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
