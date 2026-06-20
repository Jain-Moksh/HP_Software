const db = require('./config/db');
const { runCoreBackup, runCoreRestore, triggerAutoBackupIfNeeded } = require('./controllers/utilityController');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== STARTING BACKUP & RESTORE AUTOMATED TEST SUITE ===\n');
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Setup connection client
  const client = await db.connect();
  
  try {
    // 0. Ensure schema exists by initializing it if needed
    console.log('[Setup] Clearing existing data to run clean tests...');
    await client.query(`
      TRUNCATE TABLE transactions_in, transactions_out, material_transfers, 
                     jobber_adjustments, seller_adjustments, items, jobbers, sellers, vendors CASCADE;
    `);

    // Insert sample master records
    console.log('[Setup] Inserting sample master records...');
    const jobberRes = await client.query("INSERT INTO jobbers (name, opening_stock_type1, opening_stock_type2, opening_amount) VALUES ('Test Jobber A', 10, 20, 100) RETURNING id");
    const jobberId = jobberRes.rows[0].id;

    const sellerRes = await client.query("INSERT INTO sellers (name) VALUES ('Test Seller A') RETURNING id");
    const sellerId = sellerRes.rows[0].id;

    const vendorRes = await client.query("INSERT INTO vendors (name) VALUES ('Test Vendor A') RETURNING id");
    const vendorId = vendorRes.rows[0].id;

    const itemRes = await client.query("INSERT INTO items (item_name, description, job_rate, weight_type1, weight_type2) VALUES ('Test Item A', 'Test Description', 15.5, 1.2, 2.4) RETURNING id");
    const itemId = itemRes.rows[0].id;

    // Insert sample transaction/adjustment records
    console.log('[Setup] Inserting sample transactions and adjustments...');
    await client.query("INSERT INTO transactions_in (jobber_id, seller_id, type1, type2, material, rate, amount, date) VALUES ($1, $2, 5, 0, 'Iron', 100, 500, '2026-06-20')", [jobberId, sellerId]);
    await client.query("INSERT INTO transactions_out (jobber_id, vendor_id, type1, type2, material, rate, amount, date) VALUES ($1, $2, 0, 8, 'Copper', 150, 1200, '2026-06-20')", [jobberId, vendorId]);
    await client.query("INSERT INTO jobber_adjustments (jobber_id, amount, date, remark) VALUES ($1, -50, '2026-06-20', 'Sample adjustment')", [jobberId]);
    await client.query("INSERT INTO seller_adjustments (seller_id, amount, date, remark) VALUES ($1, 200, '2026-06-20', 'Promo discount')", [sellerId]);

    // Insert material transfer (needs separate jobber)
    const jobberResB = await client.query("INSERT INTO jobbers (name) VALUES ('Test Jobber B') RETURNING id");
    const jobberIdB = jobberResB.rows[0].id;
    await client.query("INSERT INTO material_transfers (from_jobber_id, to_jobber_id, type1, type2, material, date, remark) VALUES ($1, $2, 2, 3, 'Steel', '2026-06-20', 'Transfer test')", [jobberId, jobberIdB]);

    // Let's release the setup client before starting operations
    client.release();

    console.log('\n--- SETUP COMPLETED ---\n');

    // ==========================================
    // TEST 1: Create sample records, run manual backup, delete data, restore, verify
    // ==========================================
    console.log('>>> RUNNING TEST 1: Manual Backup & Restore <<<');
    const manualBackupPath = path.join(tempDir, 'test_manual_backup.sql');
    
    // Perform manual backup
    console.log('[TEST 1] Running manual backup...');
    const backupRes = await runCoreBackup(manualBackupPath);
    assert.strictEqual(backupRes.success, true);
    assert.ok(backupRes.size > 0);
    console.log(`[TEST 1] Backup successfully saved. Size: ${backupRes.size} bytes`);

    // Delete all records
    console.log('[TEST 1] Deleting data from database...');
    const testClient1 = await db.connect();
    await testClient1.query(`
      TRUNCATE TABLE transactions_in, transactions_out, material_transfers, 
                     jobber_adjustments, seller_adjustments, items, jobbers, sellers, vendors CASCADE;
    `);
    
    // Verify database is empty
    const checkEmpty1 = await testClient1.query("SELECT COUNT(*) FROM jobbers");
    assert.strictEqual(parseInt(checkEmpty1.rows[0].count, 10), 0);
    testClient1.release();
    console.log('[TEST 1] Database successfully emptied.');

    // Run restore
    console.log('[TEST 1] Restoring manual backup...');
    const restoreRes1 = await runCoreRestore(manualBackupPath);
    assert.strictEqual(restoreRes1.success, true);

    // Verify data is restored
    console.log('[TEST 1] Verifying restored data...');
    const verifyClient1 = await db.connect();
    const jobberCount1 = await verifyClient1.query("SELECT COUNT(*) FROM jobbers");
    const transInCount1 = await verifyClient1.query("SELECT COUNT(*) FROM transactions_in");
    const transferCount1 = await verifyClient1.query("SELECT COUNT(*) FROM material_transfers");
    
    assert.strictEqual(parseInt(jobberCount1.rows[0].count, 10), 2);
    assert.strictEqual(parseInt(transInCount1.rows[0].count, 10), 1);
    assert.strictEqual(parseInt(transferCount1.rows[0].count, 10), 1);
    verifyClient1.release();

    console.log('✅ TEST 1 PASSED: Manual backup and restore verified successfully.\n');

    // ==========================================
    // TEST 2: Create sample records, run automatic backup, delete data, restore, verify
    // ==========================================
    console.log('>>> RUNNING TEST 2: Automatic Backup & Restore <<<');
    
    // We will configure a local auto-backup by writing a mock config
    const configPath = path.join(__dirname, 'config', 'backup-config.json');
    const originalConfig = fs.readFileSync(configPath, 'utf8');
    
    try {
      const mockConfig = {
        enabled: true,
        interval: 0, // force backup immediately
        path: tempDir,
        backupType: "local",
        lastBackup: null,
        lastFile: null
      };
      fs.writeFileSync(configPath, JSON.stringify(mockConfig, null, 2), 'utf8');
      
      console.log('[TEST 2] Triggering background automatic backup...');
      // Clear global flag to make sure auto backup runs
      global.isBackupRestoreRunning = false;
      await triggerAutoBackupIfNeeded();
      
      // Read the newly saved configuration to get the file name
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(savedConfig.lastFile);
      const autoBackupFilePath = path.join(tempDir, savedConfig.lastFile);
      console.log(`[TEST 2] Automatic backup generated file: ${autoBackupFilePath}`);

      // Delete database data
      console.log('[TEST 2] Deleting data from database...');
      const testClient2 = await db.connect();
      await testClient2.query(`
        TRUNCATE TABLE transactions_in, transactions_out, material_transfers, 
                       jobber_adjustments, seller_adjustments, items, jobbers, sellers, vendors CASCADE;
      `);
      testClient2.release();

      // Restore using the auto backup file path
      console.log('[TEST 2] Restoring automatic backup...');
      const restoreRes2 = await runCoreRestore(autoBackupFilePath);
      assert.strictEqual(restoreRes2.success, true);

      // Verify data is restored
      console.log('[TEST 2] Verifying restored data...');
      const verifyClient2 = await db.connect();
      const jobberCount2 = await verifyClient2.query("SELECT COUNT(*) FROM jobbers");
      assert.strictEqual(parseInt(jobberCount2.rows[0].count, 10), 2);
      verifyClient2.release();

      console.log('✅ TEST 2 PASSED: Automatic backup and restore verified successfully.\n');
    } finally {
      // Restore original backup config
      fs.writeFileSync(configPath, originalConfig, 'utf8');
    }

    // ==========================================
    // TEST 3: Restore into completely empty database (dropped schema)
    // ==========================================
    console.log('>>> RUNNING TEST 3: Restore into Empty Database <<<');
    
    // We will drop public schema to simulate a completely empty database
    console.log('[TEST 3] Dropping schema "public" CASCADE...');
    const dropClient = await db.connect();
    await dropClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    dropClient.release();

    // Verify database has no tables
    const checkTablesClient = await db.connect();
    const tableCheckRes = await checkTablesClient.query(`
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    assert.strictEqual(parseInt(tableCheckRes.rows[0].count, 10), 0);
    checkTablesClient.release();
    console.log('[TEST 3] Public schema is now completely empty.');

    // Run restore
    console.log('[TEST 3] Restoring backup file to empty database...');
    const restoreRes3 = await runCoreRestore(manualBackupPath);
    assert.strictEqual(restoreRes3.success, true);

    // Verify schema recreated and data restored
    console.log('[TEST 3] Verifying schema and data...');
    const verifyClient3 = await db.connect();
    const jobberCount3 = await verifyClient3.query("SELECT COUNT(*) FROM jobbers");
    const itemCount3 = await verifyClient3.query("SELECT COUNT(*) FROM items");
    
    assert.strictEqual(parseInt(jobberCount3.rows[0].count, 10), 2);
    assert.strictEqual(parseInt(itemCount3.rows[0].count, 10), 1);
    verifyClient3.release();

    console.log('✅ TEST 3 PASSED: Restore into empty database recreated schema and restored data successfully.\n');

    // ==========================================
    // TEST 4: Restore after application restart (refresh pool)
    // ==========================================
    console.log('>>> RUNNING TEST 4: Verification After Pool Refresh / Restart <<<');
    
    console.log('[TEST 4] Refreshing database pool to simulate application restart...');
    await db.refreshPool();

    // Query data after pool refresh
    console.log('[TEST 4] Querying database after restart...');
    const verifyClient4 = await db.connect();
    const jobberCount4 = await verifyClient4.query("SELECT COUNT(*) FROM jobbers");
    const transInCount4 = await verifyClient4.query("SELECT COUNT(*) FROM transactions_in");
    
    assert.strictEqual(parseInt(jobberCount4.rows[0].count, 10), 2);
    assert.strictEqual(parseInt(transInCount4.rows[0].count, 10), 1);
    verifyClient4.release();

    console.log('✅ TEST 4 PASSED: Data remains fully visible and intact after mock application restart.\n');

    // ==========================================
    // TEST 5: Verify UI displays restored data immediately
    // ==========================================
    console.log('>>> RUNNING TEST 5: API / UI Immediate Data Reflection <<<');
    
    // Simulate UI API call directly via controller endpoint
    const mockReq = {};
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    
    const jobberController = require('./controllers/jobberController');
    console.log('[TEST 5] Calling GET /api/jobbers controller method directly...');
    await jobberController.getJobbers(mockReq, mockRes);
    
    // Verify that the immediate response contains our restored jobbers
    assert.ok(mockRes.body);
    assert.ok(Array.isArray(mockRes.body));
    console.log(`[TEST 5] GET /api/jobbers returned ${mockRes.body.length} jobbers immediately:`, mockRes.body.map(j => j.name));
    assert.strictEqual(mockRes.body.length, 2);
    
    console.log('✅ TEST 5 PASSED: Data is immediately queryable and returned by entity APIs.\n');

    console.log('=== ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY! ===');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST SUITE RUN FAILED:', err);
    process.exit(1);
  }
}

runTests();
