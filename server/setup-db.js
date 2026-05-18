const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbName = process.env.DB_NAME || 'hp';

async function ensureDatabaseExists() {
  const tempPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
  });

  try {
    const res = await tempPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rows.length === 0) {
      console.log(`Database "${dbName}" does not exist. Creating database...`);
      await tempPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error during database check/creation:', err.message);
  } finally {
    await tempPool.end();
  }
}

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: dbName,
});

async function setup() {
  try {
    console.log('--- Initializing Database ---');
    await ensureDatabaseExists();
    console.log(`Connecting to: ${dbName} on ${process.env.DB_HOST}`);
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('\nStep 1: Running schema.sql (this will not delete existing data)...');
    await pool.query(schemaSql);
    console.log('✅ All tables (Master, Transactions, Adjustments) and performance indexes are ready.');

    console.log('\nStep 2: Checking migrations...');
    // Add remark columns if they don't exist (just in case they aren't in schema.sql yet)
    await pool.query('ALTER TABLE transactions_in ADD COLUMN IF NOT EXISTS remark TEXT;');
    await pool.query('ALTER TABLE transactions_out ADD COLUMN IF NOT EXISTS remark TEXT;');
    console.log('✅ Remark columns verified.');

    console.log('\nDatabase setup completed successfully! 🎉');
    console.log('Your friend can now start the application.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Database setup failed:');
    console.error(err.message);
    process.exit(1);
  }
}

// Safety check: Prompt/Warning for the user running this
console.log('WARNING: This script will ensure all necessary tables exist in your database.');
console.log('It will NOT delete any data (uses IF NOT EXISTS).');

setup();
