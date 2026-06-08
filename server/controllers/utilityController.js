const db = require('../config/db');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');
const stream = require('stream');

const configPath = path.join(__dirname, '..', 'config', 'backup-config.json');

const isValidLocalOrUncPath = (p) => {
  if (!p || typeof p !== 'string') return false;
  
  // Reject URLs starting with protocols like ftp:, http:, sftp:, etc.
  if (/^(ftp|http|https|sftp|ftps):/i.test(p)) {
    return false;
  }
  
  // On Windows, check for invalid characters: *, ?, ", <, >, |
  const invalidChars = /[*\?"<>|]/;
  if (invalidChars.test(p)) return false;
  
  // Check for colon
  const colonIndex = p.indexOf(':');
  if (colonIndex !== -1) {
    if (colonIndex !== 1 && !(colonIndex === 2 && (p.startsWith('/') || p.startsWith('\\')))) {
      return false;
    }
    const driveLetter = p[colonIndex - 1];
    if (!/^[a-zA-Z]$/.test(driveLetter)) {
      return false;
    }
  }
  
  return true;
};

// Helper to read config
const readConfig = () => {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(data);
    return {
      enabled: !!parsed.enabled,
      interval: Number(parsed.interval) || 1440,
      path: parsed.path || "C:/Moksh Software",
      backupType: parsed.backupType || "local",
      ftpHost: parsed.ftpHost || "",
      ftpPort: Number(parsed.ftpPort) || 21,
      ftpUser: parsed.ftpUser || "",
      ftpPassword: parsed.ftpPassword || "",
      ftpSecure: !!parsed.ftpSecure,
      ftpPath: parsed.ftpPath || "",
      lastBackup: parsed.lastBackup || null,
      lastFile: parsed.lastFile || null
    };
  } catch (err) {
    return {
      enabled: false,
      interval: 1440,
      path: "C:/Moksh Software",
      backupType: "local",
      ftpHost: "",
      ftpPort: 21,
      ftpUser: "",
      ftpPassword: "",
      ftpSecure: false,
      ftpPath: "",
      lastBackup: null,
      lastFile: null
    };
  }
};

// Helper to write config
const writeConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
};

// Helper to upload a backup file via FTP
const uploadBackupToFtp = async (config, filename, sql) => {
  const client = new ftp.Client();
  client.ftp.timeout = 15000;
  try {
    await client.access({
      host: config.ftpHost,
      port: config.ftpPort,
      user: config.ftpUser || undefined,
      password: config.ftpPassword || undefined,
      secure: config.ftpSecure,
      secureOptions: {
        rejectUnauthorized: false
      }
    });

    if (config.ftpPath) {
      await client.ensureDir(config.ftpPath);
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(sql, 'utf-8'));

    await client.uploadFrom(bufferStream, filename);

    if (config.lastFile) {
      try {
        await client.remove(config.lastFile);
      } catch (delErr) {
        console.warn(`[Auto-Backup] Could not delete old remote FTP file "${config.lastFile}":`, delErr.message);
      }
    }
  } finally {
    client.close();
  }
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

  sqlParts.push(`-- HP Accounting Software Programmatic Backup\n`);
  sqlParts.push(`-- Generated: ${new Date().toLocaleString()}\n\n`);
  sqlParts.push(`BEGIN;\n\n`);

  const knownTables = [
    'items', 'jobbers', 'sellers', 'vendors', 'transactions_in', 
    'transactions_out', 'jobber_adjustments', 'seller_adjustments', 'material_transfers'
  ];

  const tableRes = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  `);
  const dbTables = tableRes.rows.map(r => r.table_name);

  const existingKnown = knownTables.filter(t => dbTables.includes(t));
  const extraTables = dbTables.filter(t => !knownTables.includes(t));
  const finalTables = [...existingKnown, ...extraTables];

  if (finalTables.length > 0) {
    // 1. Generate CREATE TABLE statements for all tables first
    sqlParts.push(`-- Creating Tables\n`);
    for (const tableName of finalTables) {
      const colRes = await db.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      if (colRes.rows.length === 0) continue;

      const ddlParts = [];
      for (const col of colRes.rows) {
        let isSerial = false;
        let typeStr = col.data_type.toUpperCase();
        
        if (col.column_default && col.column_default.includes('nextval')) {
          isSerial = true;
          if (typeStr.includes('BIGINT')) {
            typeStr = 'BIGSERIAL';
          } else if (typeStr.includes('SMALLINT')) {
            typeStr = 'SMALLSERIAL';
          } else {
            typeStr = 'SERIAL';
          }
        }

        let def = `"${col.column_name}" ${typeStr}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.column_default && !isSerial) {
          def += ` DEFAULT ${col.column_default}`;
        }
        if (col.is_nullable === 'NO' && !isSerial) {
          def += ' NOT NULL';
        }
        ddlParts.push(def);
      }

      // Add Primary Key constraint if exists
      const pkRes = await db.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
      `, [tableName]);
      
      if (pkRes.rows.length > 0) {
        const pkCols = pkRes.rows.map(r => `"${r.column_name}"`).join(', ');
        ddlParts.push(`PRIMARY KEY (${pkCols})`);
      }

      sqlParts.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${ddlParts.join(',\n  ')}\n);\n\n`);
    }

    // 2. Wiping existing data
    sqlParts.push(`TRUNCATE TABLE ${finalTables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;\n\n`);
    
    // 3. Inserting table data
    for (const tableName of finalTables) {
      const colRes = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      if (colRes.rows.length === 0) continue;

      const columns = colRes.rows.map(r => `"${r.column_name}"`);
      const hasId = colRes.rows.some(r => r.column_name === 'id');
      const query = hasId ? `SELECT * FROM "${tableName}" ORDER BY id` : `SELECT * FROM "${tableName}"`;
      
      const dataRes = await db.query(query);
      if (dataRes.rows.length === 0) continue;

      sqlParts.push(`-- Dumping ${tableName}\n`);
      for (const r of dataRes.rows) {
        const vals = colRes.rows.map(col => {
          const val = r[col.column_name];
          if (val === null || val === undefined) return 'NULL';
          
          const type = col.data_type.toLowerCase();
          if (type.includes('int') || type.includes('num') || type.includes('double') || type.includes('real')) {
            return Number(val);
          } else if (type.includes('bool')) {
            return val ? 'true' : 'false';
          } else if (type.includes('date')) {
            const d = new Date(val);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dateVal = String(d.getDate()).padStart(2, '0');
            return `'${y}-${m}-${dateVal}'`;
          } else if (type.includes('time') || type.includes('timestamp')) {
            return `'${new Date(val).toISOString()}'`;
          } else {
            return `'${val.toString().replace(/'/g, "''")}'`;
          }
        });
        
        sqlParts.push(`INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${vals.join(', ')});\n`);
      }
      sqlParts.push(`\n`);
    }

    sqlParts.push(`-- Resetting Sequences\n`);
    for (const tableName of finalTables) {
      sqlParts.push(`DO $$
DECLARE
  seq_name text;
BEGIN
  SELECT pg_get_serial_sequence('"${tableName}"', 'id') INTO seq_name;
  IF seq_name IS NOT NULL THEN
    EXECUTE 'SELECT setval(' || quote_literal(seq_name) || ', COALESCE(MAX(id), 1)) FROM "${tableName}"';
  END IF;
END $$;\n`);
    }
  }

  sqlParts.push(`\nCOMMIT;\n`);
  return sqlParts.join('');
};

// Reusable check to verify and ensure the auto-backup file is physically present in the folder
const ensureAutoBackupFileExists = async () => {
  try {
    const config = readConfig();
    if (!config.enabled) return;

    if (config.backupType === 'ftp') {
      if (config.lastFile) {
        // Assume remote file exists to speed up server boot
        return;
      }
      
      console.log(`[Auto-Backup] Startup check: Running initial backup to remote FTP server...`);
      const now = new Date();
      const sql = await generateBackupSql();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;
      
      try {
        await uploadBackupToFtp(config, filename, sql);
        console.log(`[Auto-Backup] Startup check: Successfully uploaded initial backup to FTP: ${filename}`);
        config.lastBackup = now.toISOString();
        config.lastFile = filename;
        writeConfig(config);
      } catch (ftpErr) {
        console.warn(`[Auto-Backup] Startup check failed to upload to FTP:`, ftpErr.message);
      }
    } else {
      // Local backup verification
      if (!isValidLocalOrUncPath(config.path)) {
        console.warn(`[Auto-Backup] Startup check skipped: Backup path "${config.path}" is invalid.`);
        return;
      }

      let fileExists = false;
      if (config.lastFile) {
        const backupFilePath = path.join(config.path, config.lastFile);
        if (fs.existsSync(backupFilePath)) {
          fileExists = true;
        }
      }

      if (!fileExists) {
        console.log(`[Auto-Backup] Startup check: Initial backup file missing. Generating locally...`);
        try {
          if (!fs.existsSync(config.path)) {
            fs.mkdirSync(config.path, { recursive: true });
          }
        } catch (mkdirErr) {
          console.warn(`[Auto-Backup] Startup check failed to create directory "${config.path}":`, mkdirErr.message);
          return;
        }

        const now = new Date();
        const sql = await generateBackupSql();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;
        const fullPath = path.join(config.path, filename);

        try {
          fs.writeFileSync(fullPath, sql, 'utf8');
          console.log(`[Auto-Backup] Startup check: Successfully saved initial backup locally: ${fullPath}`);
          config.lastBackup = now.toISOString();
          config.lastFile = filename;
          writeConfig(config);
        } catch (writeErr) {
          console.warn(`[Auto-Backup] Startup check failed to write backup file "${fullPath}":`, writeErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('[Auto-Backup] Startup check failed:', err.message);
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
    const { 
      enabled, 
      interval, 
      path: targetPath,
      backupType,
      ftpHost,
      ftpPort,
      ftpUser,
      ftpPassword,
      ftpSecure,
      ftpPath 
    } = req.body;
    
    const current = readConfig();
    current.enabled = !!enabled;
    current.interval = Number(interval) || 1440;
    
    if (backupType) {
      if (backupType !== 'local' && backupType !== 'ftp') {
        return res.status(400).json({ error: 'Invalid backup type.' });
      }
      current.backupType = backupType;
    }
    
    if (current.backupType === 'local') {
      if (targetPath) {
        const trimmedPath = targetPath.trim();
        if (!trimmedPath) {
          return res.status(400).json({ error: 'Backup path cannot be empty.' });
        }
        if (!isValidLocalOrUncPath(trimmedPath)) {
          return res.status(400).json({
            error: 'Invalid backup path. Network URLs (like ftp:// or http://) and special wildcard characters are not supported. Please use a local directory (e.g. C:/Backups) or a network share path (e.g. \\\\192.168.1.1\\share).'
          });
        }
        current.path = trimmedPath;
      }
    } else if (current.backupType === 'ftp') {
      if (!ftpHost || !ftpHost.trim()) {
        return res.status(400).json({ error: 'FTP Host is required when FTP destination is selected.' });
      }
      current.ftpHost = ftpHost.trim();
      current.ftpPort = Number(ftpPort) || 21;
      current.ftpUser = (ftpUser || '').trim();
      current.ftpPassword = ftpPassword || '';
      current.ftpSecure = !!ftpSecure;
      current.ftpPath = (ftpPath || '').trim();
    }
    
    writeConfig(current);
    res.json(current);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save backup configuration.' });
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

    // 1. Force drop and recreate database
    const tempPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: 'postgres',
    });

    try {
      // Terminate any active connections to the database
      await tempPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [dbName]);

      // Drop database
      await tempPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      
      // Create database
      await tempPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" recreated successfully during restore.`);

      // Initialize clean schema
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
    } catch (dbErr) {
      console.error('Failed to recreate database on restore:', dbErr);
      throw dbErr;
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

    // 3. Ensure 'created_at' exists on tables (handles older schemas) before running the cleaned SQL script
    const tablesWithCreatedAt = ['jobbers', 'sellers', 'vendors', 'transactions_in', 'transactions_out', 'jobber_adjustments', 'seller_adjustments', 'material_transfers'];
    for (const table of tablesWithCreatedAt) {
      try {
        await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } catch (err) {
        console.warn(`Could not add created_at to ${table}:`, err.message);
      }
    }

    // 3.5 Ensure opening balance columns exist for jobbers
    try {
      await db.query(`ALTER TABLE jobbers ADD COLUMN IF NOT EXISTS opening_stock_type1 NUMERIC DEFAULT 0`);
      await db.query(`ALTER TABLE jobbers ADD COLUMN IF NOT EXISTS opening_stock_type2 NUMERIC DEFAULT 0`);
      await db.query(`ALTER TABLE jobbers ADD COLUMN IF NOT EXISTS opening_amount NUMERIC DEFAULT 0`);
    } catch (err) {
      console.warn(`Could not add opening balance columns to jobbers:`, err.message);
    }

    // 4. Wipe existing data to ensure we create a new database state instead of merging
    try {
      const tableListRes = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
      `);
      const tablesToWipe = tableListRes.rows.map(r => `"${r.table_name}"`);
      if (tablesToWipe.length > 0) {
        await db.query(`TRUNCATE TABLE ${tablesToWipe.join(', ')} RESTART IDENTITY CASCADE;`);
      }
    } catch (err) {
      console.warn('Could not truncate all tables before restore:', err.message);
    }

    // 5. Run the cleaned SQL script inside the database connection
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
      console.log(`[Auto-Backup] Starting background backup (${config.backupType === 'ftp' ? 'FTP remote' : 'Local drive'})...`);
      const sql = await generateBackupSql();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;

      if (config.backupType === 'ftp') {
        try {
          await uploadBackupToFtp(config, filename, sql);
          console.log(`[Auto-Backup] Successfully uploaded backup to FTP: ${filename}`);
          config.lastBackup = now.toISOString();
          config.lastFile = filename;
          writeConfig(config);
        } catch (ftpErr) {
          console.warn(`[Auto-Backup] Failed to upload auto-backup to FTP:`, ftpErr.message);
        }
      } else {
        // Local logic
        if (!isValidLocalOrUncPath(config.path)) {
          console.warn(`[Auto-Backup] Skipped: Backup path "${config.path}" is invalid. Please configure a valid local or UNC directory.`);
          return;
        }

        try {
          if (!fs.existsSync(config.path)) {
            fs.mkdirSync(config.path, { recursive: true });
          }
        } catch (mkdirErr) {
          console.warn(`[Auto-Backup] Failed to create directory "${config.path}":`, mkdirErr.message);
          return;
        }

        if (config.lastFile) {
          try {
            const oldPath = path.join(config.path, config.lastFile);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          } catch (unlinkErr) {
            console.warn('[Auto-Backup] Failed to unlink old auto-backup file:', unlinkErr.message);
          }
        }

        const fullPath = path.join(config.path, filename);
        try {
          fs.writeFileSync(fullPath, sql, 'utf8');
          console.log(`[Auto-Backup] Successfully saved backup locally: ${fullPath}`);
          config.lastBackup = now.toISOString();
          config.lastFile = filename;
          writeConfig(config);
        } catch (writeErr) {
          console.warn(`[Auto-Backup] Failed to write backup file "${fullPath}":`, writeErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('[Auto-Backup] Background auto-backup failed:', err.message);
  }
};
