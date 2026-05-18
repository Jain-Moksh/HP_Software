const db = require('../config/db');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'backup-config.json');

// Helper to read config
const readConfig = () => {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {
      enabled: false,
      interval: 1440,
      path: "C:/Moksh Software",
      lastBackup: null,
      lastFile: null
    };
  }
};

// Helper to write config
const writeConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
};

// Escape helpers for programmatic SQL building
const escapeSqlStr = (val) => {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.toString().replace(/'/g, "''")}'`;
};

const escapeSqlDate = (val) => {
  if (!val) return 'NULL';
  return `'${new Date(val).toISOString()}'`;
};

const escapeSqlDateOnly = (val) => {
  if (!val) return 'NULL';
  // format exactly to yyyy-mm-dd to avoid timezone shifts
  const d = new Date(val);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dateVal = String(d.getDate()).padStart(2, '0');
  return `'${y}-${m}-${dateVal}'`;
};

// SQL script generation engine
const generateBackupSql = async () => {
  const sqlParts = [];

  // Disable triggers / start cascade reset
  sqlParts.push(`-- HP Accounting Software Programmatic Backup\n`);
  sqlParts.push(`-- Generated: ${new Date().toLocaleString()}\n\n`);
  sqlParts.push(`BEGIN;\n\n`);
  sqlParts.push(`TRUNCATE TABLE seller_adjustments, jobber_adjustments, material_transfers, transactions_out, transactions_in, vendors, sellers, jobbers RESTART IDENTITY CASCADE;\n\n`);

  // 1. jobbers
  const jobbers = await db.query('SELECT * FROM jobbers ORDER BY id');
  if (jobbers.rows.length > 0) {
    sqlParts.push(`-- Dumping jobbers\n`);
    for (const r of jobbers.rows) {
      sqlParts.push(`INSERT INTO jobbers (id, name, created_at) VALUES (${r.id}, ${escapeSqlStr(r.name)}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // 2. sellers
  const sellers = await db.query('SELECT * FROM sellers ORDER BY id');
  if (sellers.rows.length > 0) {
    sqlParts.push(`-- Dumping sellers\n`);
    for (const r of sellers.rows) {
      sqlParts.push(`INSERT INTO sellers (id, name, created_at) VALUES (${r.id}, ${escapeSqlStr(r.name)}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // 3. vendors
  const vendors = await db.query('SELECT * FROM vendors ORDER BY id');
  if (vendors.rows.length > 0) {
    sqlParts.push(`-- Dumping vendors\n`);
    for (const r of vendors.rows) {
      sqlParts.push(`INSERT INTO vendors (id, name, created_at) VALUES (${r.id}, ${escapeSqlStr(r.name)}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // 4. transactions_in
  const txIn = await db.query('SELECT * FROM transactions_in ORDER BY id');
  if (txIn.rows.length > 0) {
    sqlParts.push(`-- Dumping transactions_in\n`);
    for (const r of txIn.rows) {
      sqlParts.push(`INSERT INTO transactions_in (id, jobber_id, seller_id, type1, type2, material, rate, amount, date, remark, w, b, a, created_at) VALUES (${r.id}, ${r.jobber_id || 'NULL'}, ${r.seller_id || 'NULL'}, ${r.type1 || 0}, ${r.type2 || 0}, ${escapeSqlStr(r.material)}, ${r.rate || 0}, ${r.amount || 0}, ${escapeSqlDateOnly(r.date)}, ${escapeSqlStr(r.remark)}, ${r.w || false}, ${r.b || false}, ${r.a || false}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // 5. transactions_out
  const txOut = await db.query('SELECT * FROM transactions_out ORDER BY id');
  if (txOut.rows.length > 0) {
    sqlParts.push(`-- Dumping transactions_out\n`);
    for (const r of txOut.rows) {
      sqlParts.push(`INSERT INTO transactions_out (id, jobber_id, vendor_id, type1, type2, material, rate, amount, date, remark, w, b, a, created_at) VALUES (${r.id}, ${r.jobber_id || 'NULL'}, ${r.vendor_id || 'NULL'}, ${r.type1 || 0}, ${r.type2 || 0}, ${escapeSqlStr(r.material)}, ${r.rate || 0}, ${r.amount || 0}, ${escapeSqlDateOnly(r.date)}, ${escapeSqlStr(r.remark)}, ${r.w || false}, ${r.b || false}, ${r.a || false}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // 6. jobber_adjustments
  const jobberAdj = await db.query('SELECT * FROM jobber_adjustments ORDER BY id');
  if (jobberAdj.rows.length > 0) {
    sqlParts.push(`-- Dumping jobber_adjustments\n`);
    for (const r of jobberAdj.rows) {
      sqlParts.push(`INSERT INTO jobber_adjustments (id, jobber_id, amount, date, remark, created_at) VALUES (${r.id}, ${r.jobber_id || 'NULL'}, ${r.amount || 0}, ${escapeSqlDateOnly(r.date)}, ${escapeSqlStr(r.remark)}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // 7. seller_adjustments
  const sellerAdj = await db.query('SELECT * FROM seller_adjustments ORDER BY id');
  if (sellerAdj.rows.length > 0) {
    sqlParts.push(`-- Dumping seller_adjustments\n`);
    for (const r of sellerAdj.rows) {
      sqlParts.push(`INSERT INTO seller_adjustments (id, seller_id, amount, date, remark, created_at) VALUES (${r.id}, ${r.seller_id || 'NULL'}, ${r.amount || 0}, ${escapeSqlDateOnly(r.date)}, ${escapeSqlStr(r.remark)}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // 8. material_transfers
  const transfers = await db.query('SELECT * FROM material_transfers ORDER BY id');
  if (transfers.rows.length > 0) {
    sqlParts.push(`-- Dumping material_transfers\n`);
    for (const r of transfers.rows) {
      sqlParts.push(`INSERT INTO material_transfers (id, from_jobber_id, to_jobber_id, type1, type2, material, date, remark, created_at) VALUES (${r.id}, ${r.from_jobber_id || 'NULL'}, ${r.to_jobber_id || 'NULL'}, ${r.type1 || 0}, ${r.type2 || 0}, ${escapeSqlStr(r.material)}, ${escapeSqlDateOnly(r.date)}, ${escapeSqlStr(r.remark)}, ${escapeSqlDate(r.created_at)});\n`);
    }
    sqlParts.push(`\n`);
  }

  // Reset Sequences
  sqlParts.push(`-- Resetting Sequences\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('jobbers', 'id'), COALESCE(MAX(id), 1)) FROM jobbers;\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('sellers', 'id'), COALESCE(MAX(id), 1)) FROM sellers;\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('vendors', 'id'), COALESCE(MAX(id), 1)) FROM vendors;\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('transactions_in', 'id'), COALESCE(MAX(id), 1)) FROM transactions_in;\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('transactions_out', 'id'), COALESCE(MAX(id), 1)) FROM transactions_out;\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('jobber_adjustments', 'id'), COALESCE(MAX(id), 1)) FROM jobber_adjustments;\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('seller_adjustments', 'id'), COALESCE(MAX(id), 1)) FROM seller_adjustments;\n`);
  sqlParts.push(`SELECT setval(pg_get_serial_sequence('material_transfers', 'id'), COALESCE(MAX(id), 1)) FROM material_transfers;\n\n`);

  sqlParts.push(`COMMIT;\n`);

  return sqlParts.join('');
};

// Reusable check to verify and ensure the auto-backup file is physically present in the folder
const ensureAutoBackupFileExists = async () => {
  try {
    const config = readConfig();
    
    // Create folder path if it does not exist
    if (!fs.existsSync(config.path)) {
      fs.mkdirSync(config.path, { recursive: true });
    }

    let fileExists = false;
    if (config.lastFile) {
      const backupFilePath = path.join(config.path, config.lastFile);
      if (fs.existsSync(backupFilePath)) {
        fileExists = true;
      }
    }

    // If the file is missing or has never been generated, create it right now!
    if (!fileExists) {
      const now = new Date();
      const sql = await generateBackupSql();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;
      const fullPath = path.join(config.path, filename);

      fs.writeFileSync(fullPath, sql, 'utf8');

      // Update configuration details
      config.lastBackup = now.toISOString();
      config.lastFile = filename;
      writeConfig(config);
    }
  } catch (err) {
    console.error('Failed to ensure auto-backup file exists:', err);
  }
};

exports.ensureAutoBackupFileExists = ensureAutoBackupFileExists;

// GET /api/utility/backup/config
exports.getBackupConfig = async (req, res) => {
  try {
    // Run verification check every time page/config is requested
    await ensureAutoBackupFileExists();
    const config = readConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read backup configuration' });
  }
};

// POST /api/utility/backup/config
exports.saveBackupConfig = async (req, res) => {
  try {
    const { enabled, interval, path: targetPath } = req.body;
    const current = readConfig();
    current.enabled = !!enabled;
    current.interval = Number(interval) || 1440;
    if (targetPath) current.path = targetPath;
    writeConfig(current);
    res.json(current);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save backup configuration' });
  }
};

// GET /api/utility/backup/download
exports.downloadManualBackup = async (req, res) => {
  try {
    const sql = await generateBackupSql();
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `HP_Backup_${dateStr}_${timeStr}.sql`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sql);
  } catch (err) {
    console.error('Error generating manual backup:', err);
    res.status(500).json({ error: 'Failed to create backup download' });
  }
};

// POST /api/utility/restore
exports.restoreBackup = async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || sql.trim() === "") {
      return res.status(400).json({ error: 'No SQL content provided' });
    }

    const dbName = process.env.DB_NAME || 'hp';

    // 1. Connect to default 'postgres' database to check/create the target database dynamically
    const tempPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: 'postgres',
    });

    try {
      const dbCheck = await tempPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
      if (dbCheck.rows.length === 0) {
        console.log(`Database "${dbName}" does not exist. Creating database during restore request...`);
        await tempPool.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Database "${dbName}" created successfully.`);

        // Since the database was just created from scratch, let's initialize all table structures from schema.sql first!
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          const newDbPool = new Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: dbName,
          });
          await newDbPool.query(schemaSql);
          await newDbPool.end();
          console.log(`✅ Initialized clean schema migrations successfully.`);
        }
      }
    } catch (dbErr) {
      console.error('Failed to verify/create database dynamically on restore:', dbErr);
    } finally {
      await tempPool.end();
    }

    // 2. Programmatically clean the SQL to filter out database drop/creation/connections
    const cleanedSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim().toLowerCase();
        return !(
          trimmed.startsWith('create database ') ||
          trimmed.startsWith('drop database ') ||
          trimmed.startsWith('alter database ') ||
          trimmed.startsWith('\\c ') ||
          trimmed.startsWith('\\connect ')
        );
      })
      .join('\n');

    // 3. Run the cleaned SQL script inside the database connection
    await db.query(cleanedSql);

    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err) {
    console.error('Error restoring database:', err);
    res.status(500).json({ error: 'Failed to restore database from backup file' });
  }
};

// Automatic background backup worker trigger
exports.triggerAutoBackupIfNeeded = async () => {
  try {
    const config = readConfig();
    if (!config.enabled) return;

    const now = new Date();
    const elapsedMinutes = config.lastBackup ? (now - new Date(config.lastBackup)) / (1000 * 60) : Infinity;

    if (elapsedMinutes >= config.interval) {
      // Create path if it doesn't exist
      if (!fs.existsSync(config.path)) {
        fs.mkdirSync(config.path, { recursive: true });
      }

      // Safely delete the previous automatic backup file if it exists to preserve disk space
      if (config.lastFile) {
        try {
          const oldPath = path.join(config.path, config.lastFile);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (unlinkErr) {
          console.error('Failed to unlink old auto-backup file:', unlinkErr);
        }
      }

      const sql = await generateBackupSql();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;
      const fullPath = path.join(config.path, filename);

      fs.writeFileSync(fullPath, sql, 'utf8');

      // Update config metadata
      config.lastBackup = now.toISOString();
      config.lastFile = filename;
      writeConfig(config);
    }
  } catch (err) {
    console.error('Background auto-backup failed:', err);
  }
};
