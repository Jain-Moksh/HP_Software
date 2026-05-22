const db = require('../config/db');

// Get Job Report for a specific jobber
exports.getJobReport = async (req, res) => {
  try {
    const { jobber } = req.params;

    // 1. Find jobber ID from name
    const jobberResult = await db.query('SELECT * FROM jobbers WHERE name = $1', [jobber]);
    if (jobberResult.rows.length === 0) {
        return res.status(404).json({ error: 'Jobber not found' });
    }
    const jobberData = jobberResult.rows[0];
    const jobberId = jobberData.id;

    // 2. Fetch IN transactions
    const inRes = await db.query(`
        SELECT t.*, 'IN' as tx_type, s.name as seller 
        FROM transactions_in t
        LEFT JOIN sellers s ON t.seller_id = s.id
        WHERE t.jobber_id = $1 AND NOT COALESCE(t.a, FALSE)
    `, [jobberId]);

    // 3. Fetch OUT transactions
    const outRes = await db.query(`
        SELECT t.*, 'OUT' as tx_type, v.name as vendor
        FROM transactions_out t
        LEFT JOIN vendors v ON t.vendor_id = v.id
        WHERE t.jobber_id = $1 AND NOT COALESCE(t.a, FALSE)
    `, [jobberId]);

    // 4. Fetch Adjustments (Payments/Deductions)
    const adjRes = await db.query(`
        SELECT *, 'OUT_ADJ' as tx_type 
        FROM jobber_adjustments 
        WHERE jobber_id = $1
    `, [jobberId]);

    // 4.1 Fetch Transfers IN (where jobber is receiver)
    const transferInRes = await db.query(`
        SELECT t.*, 'TRANSFER_IN' as tx_type, j.name as from_jobber
        FROM material_transfers t
        LEFT JOIN jobbers j ON t.from_jobber_id = j.id
        WHERE t.to_jobber_id = $1
    `, [jobberId]);

    // 4.2 Fetch Transfers OUT (where jobber is sender)
    const transferOutRes = await db.query(`
        SELECT t.*, 'TRANSFER_OUT' as tx_type, j.name as to_jobber
        FROM material_transfers t
        LEFT JOIN jobbers j ON t.to_jobber_id = j.id
        WHERE t.from_jobber_id = $1
    `, [jobberId]);

    // 5. Combine and sort
    const transactions = [
        ...inRes.rows, 
        ...outRes.rows, 
        ...adjRes.rows,
        ...transferInRes.rows,
        ...transferOutRes.rows
    ].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );

    // 5. Calculate Stock
    const openingStock = { 
        type1: Number(jobberData.opening_stock_type1) || 0, 
        type2: Number(jobberData.opening_stock_type2) || 0 
    };
    const openingAmount = Number(jobberData.opening_amount) || 0;
    
    let totalInT1 = 0, totalInT2 = 0;
    let totalOutT1 = 0, totalOutT2 = 0;

    inRes.rows.forEach(tx => {
        totalInT1 += Number(tx.type1) || 0;
        totalInT2 += Number(tx.type2) || 0;
    });

    transferInRes.rows.forEach(tx => {
        totalInT1 += Number(tx.type1) || 0;
        totalInT2 += Number(tx.type2) || 0;
    });

    outRes.rows.forEach(tx => {
        totalOutT1 += Number(tx.type1) || 0;
        totalOutT2 += Number(tx.type2) || 0;
    });

    transferOutRes.rows.forEach(tx => {
        totalOutT1 += Number(tx.type1) || 0;
        totalOutT2 += Number(tx.type2) || 0;
    });

    const closingStock = {
      type1: openingStock.type1 + totalInT1 - totalOutT1,
      type2: openingStock.type2 + totalInT2 - totalOutT2
    };

    res.json({
      jobberId,
      jobberName: jobber,
      openingStock,
      openingAmount,
      transactions,
      closingStock
    });
  } catch (error) {
    console.error('Error generating job report:', error);
    res.status(500).json({ error: 'Failed to generate job report' });
  }
};
