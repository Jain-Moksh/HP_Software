const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function migrate() {
  try {
    console.log('Starting migration: Adding remark columns...');
    
    await pool.query('ALTER TABLE transactions_in ADD COLUMN IF NOT EXISTS remark TEXT;');
    console.log('✅ Added remark to transactions_in');
    
    await pool.query('ALTER TABLE transactions_out ADD COLUMN IF NOT EXISTS remark TEXT;');
    console.log('✅ Added remark to transactions_out');

    await pool.query(`
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

      CREATE INDEX IF NOT EXISTS idx_transfers_from_jobber ON material_transfers(from_jobber_id);
      CREATE INDEX IF NOT EXISTS idx_transfers_to_jobber ON material_transfers(to_jobber_id);
      CREATE INDEX IF NOT EXISTS idx_transfers_date ON material_transfers(date);
    `);
    console.log('✅ Created jobber_adjustments, seller_adjustments, and material_transfers tables with indexes');
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
