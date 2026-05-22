const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool;
let isInitialized = false;
let initPromise = null;

async function init() {
  const dbName = process.env.DB_NAME || 'hp';
  
  // Connect to default 'postgres' db to check/create our target db
  const tempPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
  });

  try {
    const res = await tempPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    let created = false;
    if (res.rows.length === 0) {
      console.log(`Database "${dbName}" does not exist. Creating database...`);
      await tempPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
      created = true;
    }
    
    // Create main pool connected to our target database
    pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: dbName,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // If just created, run schema.sql
    if (created) {
      const schemaPath = path.join(__dirname, '../schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('Running schema.sql...');
        await pool.query(schemaSql);
        console.log('✅ Schema created.');
      }
    }

    // Auto-migrate missing columns for pieces
    await pool.query('ALTER TABLE transactions_out ADD COLUMN IF NOT EXISTS type1_b NUMERIC DEFAULT 0;').catch(e => console.error(e));
    await pool.query('ALTER TABLE transactions_out ADD COLUMN IF NOT EXISTS type2_b NUMERIC DEFAULT 0;').catch(e => console.error(e));

    console.log('✅ Connected to the PostgreSQL database');
    isInitialized = true;
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  } finally {
    await tempPool.end();
  }
}

// Start initialization immediately
initPromise = init();

module.exports = {
  query: async (text, params) => {
    if (!isInitialized) await initPromise;
    return pool.query(text, params);
  },
  connect: async () => {
    if (!isInitialized) await initPromise;
    return pool.connect();
  },
};
