-- Master Tables
CREATE TABLE IF NOT EXISTS jobbers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Tables (v2)
CREATE TABLE IF NOT EXISTS transactions_in (
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

CREATE TABLE IF NOT EXISTS transactions_out (
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

-- Adjustments
CREATE TABLE IF NOT EXISTS jobber_adjustments (
    id SERIAL PRIMARY KEY,
    jobber_id INTEGER REFERENCES jobbers(id),
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seller_adjustments (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES sellers(id),
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material Transfers (Internal Stock Movement)
CREATE TABLE IF NOT EXISTS material_transfers (
    id SERIAL PRIMARY KEY,
    from_jobber_id INTEGER REFERENCES jobbers(id) ON DELETE CASCADE,
    to_jobber_id INTEGER REFERENCES jobbers(id) ON DELETE CASCADE,
    type1 NUMERIC DEFAULT 0,
    type2 NUMERIC DEFAULT 0,
    material VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_different_jobbers CHECK (from_jobber_id <> to_jobber_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_in_jobber ON transactions_in(jobber_id);
CREATE INDEX IF NOT EXISTS idx_in_date ON transactions_in(date);
CREATE INDEX IF NOT EXISTS idx_out_jobber ON transactions_out(jobber_id);
CREATE INDEX IF NOT EXISTS idx_out_date ON transactions_out(date);
CREATE INDEX IF NOT EXISTS idx_transfers_from_jobber ON material_transfers(from_jobber_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_jobber ON material_transfers(to_jobber_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON material_transfers(date);


