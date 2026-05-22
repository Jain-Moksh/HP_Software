const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Test the connection immediately on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to the PostgreSQL database');
    // Auto-migrate missing columns for pieces
    pool.query('ALTER TABLE transactions_out ADD COLUMN IF NOT EXISTS type1_b NUMERIC DEFAULT 0;').catch(e => console.error(e));
    pool.query('ALTER TABLE transactions_out ADD COLUMN IF NOT EXISTS type2_b NUMERIC DEFAULT 0;').catch(e => console.error(e));
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
