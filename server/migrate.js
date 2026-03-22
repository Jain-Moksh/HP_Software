const { Pool } = require('pg');
require('dotenv').config();

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
    `);
    console.log('✅ Created jobber_adjustments and seller_adjustments tables');
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
