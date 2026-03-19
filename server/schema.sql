CREATE TABLE material_transactions (
    id SERIAL PRIMARY KEY,
    tx_type VARCHAR(10) CHECK (tx_type IN ('IN', 'OUT')),
    type1 NUMERIC DEFAULT 0,
    type2 NUMERIC DEFAULT 0,
    material VARCHAR(255),
    rate NUMERIC(10,2) DEFAULT 0,
    seller VARCHAR(255),
    jobber VARCHAR(255),
    date DATE,
    amount NUMERIC(10,2) DEFAULT 0,
    w BOOLEAN DEFAULT FALSE,
    b BOOLEAN DEFAULT FALSE,
    a BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
