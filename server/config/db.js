const { Pool, types } = require('pg');
types.setTypeParser(1082, (val) => val); // 1082 is the OID for DATE type
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

    // Auto-migrate jobbers missing columns
    await pool.query('ALTER TABLE jobbers ADD COLUMN IF NOT EXISTS opening_stock_type1 NUMERIC DEFAULT 0;').catch(e => console.error(e));
    await pool.query('ALTER TABLE jobbers ADD COLUMN IF NOT EXISTS opening_stock_type2 NUMERIC DEFAULT 0;').catch(e => console.error(e));
    await pool.query('ALTER TABLE jobbers ADD COLUMN IF NOT EXISTS opening_amount NUMERIC DEFAULT 0;').catch(e => console.error(e));

    // Auto-migrate items table schema
    try {
      const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'name';`);
      if (res.rows.length > 0) {
        await pool.query(`ALTER TABLE items RENAME COLUMN name TO item_name`);
      }
      await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;');
      await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS job_rate NUMERIC DEFAULT 0;');
      await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS weight_type1 NUMERIC DEFAULT 0;');
      await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS weight_type2 NUMERIC DEFAULT 0;');
      await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
      await pool.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
    } catch (e) {
      console.error('Error auto-migrating items table:', e);
    }

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
    try {
      return await pool.query(text, params);
    } catch (err) {
      // 42P01 is the PostgreSQL error code for 'undefined_table'
      if (err.code === '42P01') {
        console.warn(`[Auto-Repair] Missing table detected (42P01). Running schema.sql...`);
        const schemaPath = path.join(__dirname, '../schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          await pool.query(schemaSql);
          console.log('[Auto-Repair] Schema successfully recreated. Retrying query...');
          return await pool.query(text, params);
        }
      }
      throw err;
    }
  },
  connect: async () => {
    if (!isInitialized) await initPromise;
    return pool.connect();
  },
};
