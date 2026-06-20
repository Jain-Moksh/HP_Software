const db = require('../config/db');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');
const stream = require('stream');
const { execFile } = require('child_process');
const util = require('util');
const readline = require('readline');
const execFileAsync = util.promisify(execFile);

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
const uploadBackupToFtp = async (config, filename, filePath) => {
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

    await client.uploadFrom(filePath, filename);

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

// Helper to locate pg_dump/psql
const getPgUtilPath = (utilName) => {
  const basePaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin',
    'C:\\Program Files\\PostgreSQL\\17\\bin',
  ];
  for (const p of basePaths) {
    const fullPath = path.join(p, `${utilName}.exe`);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return `${utilName}.exe`;
};

// Helper to count expected rows in backup plain text streamingly
const getExpectedRowCounts = async (filePath) => {
  const counts = {};
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentTable = null;
  let inCopy = false;

  for await (const line of rl) {
    const trimmed = line.trim();
    
    // Check for COPY public.tablename (...) FROM stdin;
    const copyMatch = trimmed.match(/^COPY\s+(?:public\.)?"?(\w+)"?\s*(?:\([^)]+\))?\s*FROM\s+stdin/i);
    if (copyMatch) {
      currentTable = copyMatch[1];
      counts[currentTable] = 0;
      inCopy = true;
      continue;
    }
    
    if (inCopy) {
      if (trimmed === '\\.') {
        inCopy = false;
        currentTable = null;
      } else if (trimmed !== '') {
        counts[currentTable]++;
      }
      continue;
    }
    
    // Check for INSERT INTO public.tablename or tablename
    const insertMatch = trimmed.match(/^INSERT\s+INTO\s+(?:public\.)?"?(\w+)"?/i);
    if (insertMatch) {
      const table = insertMatch[1];
      counts[table] = (counts[table] || 0) + 1;
    }
  }
  return counts;
};

// Shared Core Backup Engine
const runCoreBackup = async (outputPath) => {
  console.log('[BACKUP] Backup started');
  const pgDumpPath = getPgUtilPath('pg_dump');
  
  const dbName = process.env.DB_NAME || 'hp';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5433';
  const dbPassword = process.env.DB_PASSWORD || 'Pass@123';
  
  const args = [
    '-U', dbUser,
    '-h', dbHost,
    '-p', dbPort,
    '-d', dbName,
    '-F', 'p', // Plain SQL format
    '-f', outputPath
  ];
  
  const env = {
    ...process.env,
    PGPASSWORD: dbPassword
  };
  
  try {
    await execFileAsync(pgDumpPath, args, { env });
    
    // Validation
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Backup file does not exist at ${outputPath}`);
    }
    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('Backup file is empty (size is 0 bytes)');
    }
    
    // Verify readable (can open it)
    const fd = fs.openSync(outputPath, 'r');
    fs.closeSync(fd);
    
    console.log('[BACKUP] Backup completed');
    console.log(`[BACKUP] Backup size: ${stats.size} bytes`);
    console.log(`[BACKUP] Backup location: ${outputPath}`);
    
    return {
      success: true,
      size: stats.size,
      location: outputPath
    };
  } catch (err) {
    console.error(`[BACKUP] Backup failed:`, err);
    throw err;
  }
};

// Shared Core Restore Engine
const runCoreRestore = async (filePath) => {
  global.isBackupRestoreRunning = true;
  console.log('[RESTORE] Backup file detected');
  
  // 4. Verify backup file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file does not exist at ${filePath}`);
  }
  
  // 5. Verify backup file size > 0
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    throw new Error('Restore file is empty');
  }
  
  // 6. Verify backup file format is valid (read first 1000 characters)
  console.log('[RESTORE] Validation started');
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(1000);
  const bytesRead = fs.readSync(fd, buffer, 0, 1000, 0);
  fs.closeSync(fd);
  const headerCheck = buffer.toString('utf8', 0, bytesRead);
  if (!headerCheck.includes('PostgreSQL database dump') && 
      !headerCheck.includes('CREATE TABLE') && 
      !headerCheck.includes('INSERT INTO')) {
    throw new Error('Invalid backup file format: Not a recognized PostgreSQL SQL dump');
  }
  
  const psqlPath = getPgUtilPath('psql');
  const dbName = process.env.DB_NAME || 'hp';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5433';
  const dbPassword = process.env.DB_PASSWORD || 'Pass@123';
  
  // Create a rollback backup of current database before starting
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempRollbackPath = path.join(tempDir, `rollback_temp_${Date.now()}.sql`);
  let createdRollback = false;
  try {
    console.log('[RESTORE] Creating rollback point...');
    await runCoreBackup(tempRollbackPath);
    createdRollback = true;
  } catch (rollbackBackupErr) {
    console.warn('[RESTORE] Warning: Could not create rollback backup. Continuing without rollback capability.', rollbackBackupErr.message);
  }
  
  const executeRollback = async () => {
    if (!createdRollback || !fs.existsSync(tempRollbackPath)) {
      console.error('[RESTORE] [ROLLBACK] Rollback skipped: No rollback backup file found');
      return;
    }
    console.log('[RESTORE] [ROLLBACK] Initiating rollback to original state...');
    try {
      // Clean schema
      const client = await db.connect();
      try {
        await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      } finally {
        client.release();
      }
      
      // Execute psql with rollback file
      const rollbackArgs = [
        '-v', 'ON_ERROR_STOP=1',
        '-U', dbUser,
        '-h', dbHost,
        '-p', dbPort,
        '-d', dbName,
        '-f', tempRollbackPath
      ];
      await execFileAsync(psqlPath, rollbackArgs, { env: { ...process.env, PGPASSWORD: dbPassword } });
      console.log('[RESTORE] [ROLLBACK] Rollback completed successfully.');
      
      // Refresh connection pool after rollback
      const refreshDb = require('../config/db');
      if (refreshDb.refreshPool) {
        await refreshDb.refreshPool();
      }
    } catch (rollbackErr) {
      console.error('[RESTORE] [ROLLBACK] Critical error during rollback restore:', rollbackErr);
    } finally {
      try {
        if (fs.existsSync(tempRollbackPath)) fs.unlinkSync(tempRollbackPath);
      } catch (_) {}
    }
  };
  
  try {
    // 7. Ensure target database exists
    // 8. Create database if missing
    console.log('[RESTORE] Database verification started');
    const tempPool = new Pool({
      user: dbUser,
      password: dbPassword,
      host: dbHost,
      port: Number(dbPort),
      database: 'postgres',
    });
    try {
      const dbCheckRes = await tempPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
      if (dbCheckRes.rows.length === 0) {
        console.log(`[RESTORE] Target database "${dbName}" does not exist. Creating...`);
        await tempPool.query(`CREATE DATABASE "${dbName}"`);
      }
    } finally {
      await tempPool.end();
    }
    
    // 9. Clean restoration target safely
    console.log('[RESTORE] Cleaning target');
    const cleanClient = await db.connect();
    try {
      await cleanClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    } finally {
      cleanClient.release();
    }
    
    // 10. Execute restore
    // 11. Configure restore command to fail immediately on SQL errors (psql ON_ERROR_STOP=1)
    console.log('[RESTORE] Import started');
    const args = [
      '-v', 'ON_ERROR_STOP=1',
      '-U', dbUser,
      '-h', dbHost,
      '-p', dbPort,
      '-d', dbName,
      '-f', filePath
    ];
    
    const env = {
      ...process.env,
      PGPASSWORD: dbPassword
    };
    
    // 12. Wait for restore completion
    await execFileAsync(psqlPath, args, { env });
    console.log('[RESTORE] Import completed');
    
    // 14. Refresh database connection pool
    // 15. Clear stale connections
    const refreshDb = require('../config/db');
    if (refreshDb.refreshPool) {
      await refreshDb.refreshPool();
    }
    
    // 13. Validate restore integrity
    console.log('[RESTORE] Validation started');
    const expectedCounts = await getExpectedRowCounts(filePath);
    const requiredTables = [
      'items', 'jobbers', 'sellers', 'vendors', 'transactions_in', 
      'transactions_out', 'jobber_adjustments', 'seller_adjustments', 'material_transfers'
    ];
    
    const verificationClient = await db.connect();
    try {
      // 1. Verify required tables exist
      const tableCheckRes = await verificationClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
      `);
      const existingTables = tableCheckRes.rows.map(r => r.table_name);
      for (const table of requiredTables) {
        if (!existingTables.includes(table)) {
          throw new Error(`Validation failed: Required table "${table}" is missing after restore`);
        }
      }
      
      // 2. Verify expected row counts
      for (const table of requiredTables) {
        const countRes = await verificationClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const actualCount = parseInt(countRes.rows[0].count, 10);
        console.log(`[RESTORE] Table "${table}": Actual row count = ${actualCount}`);
        
        if (expectedCounts[table] !== undefined) {
          const expected = expectedCounts[table];
          if (actualCount !== expected) {
            throw new Error(`Validation failed: Table "${table}" has row count mismatch. Expected ${expected}, got ${actualCount}`);
          }
        }
      }
      
      // 3. Verify database can be queried and primary entities exist
      for (const table of requiredTables) {
        await verificationClient.query(`SELECT 1 FROM "${table}" LIMIT 1`);
      }
    } finally {
      verificationClient.release();
    }
    
    console.log('[RESTORE] Validation completed');
    console.log('[RESTORE] Restore successful');
    
    // Cleanup temporary rollback file
    try {
      if (fs.existsSync(tempRollbackPath)) fs.unlinkSync(tempRollbackPath);
    } catch (e) {
      console.warn('Could not clean up temporary rollback file:', e.message);
    }
    
    return { success: true };
  } catch (err) {
    console.error('[RESTORE] Restore failed:', err);
    await executeRollback();
    throw err;
  } finally {
    // 16. Re-enable auto-healing
    // 17. Set global.isBackupRestoreRunning = false
    global.isBackupRestoreRunning = false;
  }
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
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const tempPath = path.join(tempDir, `auto_backup_startup_${Date.now()}.sql`);
      
      try {
        await runCoreBackup(tempPath);
        const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;
        
        await uploadBackupToFtp(config, filename, tempPath);
        console.log(`[Auto-Backup] Startup check: Successfully uploaded initial backup to FTP: ${filename}`);
        config.lastBackup = now.toISOString();
        config.lastFile = filename;
        writeConfig(config);
      } catch (ftpErr) {
        console.warn(`[Auto-Backup] Startup check failed to upload to FTP:`, ftpErr.message);
      } finally {
        if (fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath); } catch (_) {}
        }
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
        const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;
        const fullPath = path.join(config.path, filename);

        try {
          await runCoreBackup(fullPath);
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
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempPath = path.join(tempDir, `manual_backup_${Date.now()}.sql`);
  
  try {
    await runCoreBackup(tempPath);
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `HP_Backup_${dateStr}_${timeStr}.sql`;

    res.download(tempPath, filename, (err) => {
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (unlinkErr) {
        console.error('Failed to unlink manual backup temp file:', unlinkErr);
      }
      if (err) {
        console.error('Error during manual backup file download:', err);
      }
    });
  } catch (err) {
    console.error('Error generating manual backup:', err);
    res.status(500).json({ error: 'Failed to create backup download' });
  }
};

// POST /api/utility/restore
exports.restoreBackup = async (req, res) => {
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempRestorePath = path.join(tempDir, `restore_${Date.now()}.sql`);

  try {
    const { sql } = req.body;
    if (!sql || sql.trim() === "") {
      return res.status(400).json({ error: 'No SQL content provided' });
    }

    // Write input SQL to a temporary file
    fs.writeFileSync(tempRestorePath, sql, 'utf8');

    // Run core restore engine using the file path
    await runCoreRestore(tempRestorePath);

    // Cleanup temp restore file
    try {
      if (fs.existsSync(tempRestorePath)) fs.unlinkSync(tempRestorePath);
    } catch (_) {}

    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err) {
    // Cleanup temp restore file on failure
    try {
      if (fs.existsSync(tempRestorePath)) fs.unlinkSync(tempRestorePath);
    } catch (_) {}

    console.error('Error restoring database:', err);
    res.status(500).json({ error: err.message || 'Failed to restore database from backup file' });
  }
};

// Automatic background backup worker trigger
exports.triggerAutoBackupIfNeeded = async () => {
  try {
    if (global.isBackupRestoreRunning) {
      console.log('[Auto-Backup] Skipped background backup because backup/restore is currently running.');
      return;
    }

    const config = readConfig();
    if (!config.enabled) return;

    const now = new Date();
    const elapsedMinutes = config.lastBackup ? (now - new Date(config.lastBackup)) / (1000 * 60) : Infinity;

    if (elapsedMinutes >= config.interval) {
      console.log(`[Auto-Backup] Starting background backup (${config.backupType === 'ftp' ? 'FTP remote' : 'Local drive'})...`);
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `AutoBackup-${dateStr}--${timeStr}.sql`;

      if (config.backupType === 'ftp') {
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempPath = path.join(tempDir, `auto_backup_ftp_${Date.now()}.sql`);
        try {
          await runCoreBackup(tempPath);
          await uploadBackupToFtp(config, filename, tempPath);
          console.log(`[Auto-Backup] Successfully uploaded backup to FTP: ${filename}`);
          config.lastBackup = now.toISOString();
          config.lastFile = filename;
          writeConfig(config);
        } catch (ftpErr) {
          console.warn(`[Auto-Backup] Failed to upload auto-backup to FTP:`, ftpErr.message);
        } finally {
          if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (_) {}
          }
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

        const fullPath = path.join(config.path, filename);
        try {
          await runCoreBackup(fullPath);
          
          if (config.lastFile && config.lastFile !== filename) {
            try {
              const oldPath = path.join(config.path, config.lastFile);
              if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
              }
            } catch (unlinkErr) {
              console.warn('[Auto-Backup] Failed to unlink old auto-backup file:', unlinkErr.message);
            }
          }

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

exports.runCoreBackup = runCoreBackup;
exports.runCoreRestore = runCoreRestore;

