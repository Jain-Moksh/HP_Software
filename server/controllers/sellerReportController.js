const db = require('../config/db');

// Get Seller Report for a specific seller
exports.getSellerReport = async (req, res) => {
  try {
    const { sellerName } = req.params;

    // 1. Find seller ID from name (case-insensitive for safety, but user selects from list)
    const sellerResult = await db.query('SELECT id FROM sellers WHERE name = $1', [sellerName]);
    if (sellerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Seller not found' });
    }
    const sellerId = sellerResult.rows[0].id;

    // 2. Fetch IN transactions for this seller
    const transactions = await db.query(`
        SELECT t.*, j.name as jobber, 'IN' as tx_type
        FROM transactions_in t
        LEFT JOIN jobbers j ON t.jobber_id = j.id
        WHERE t.seller_id = $1
        ORDER BY t.date DESC, t.created_at DESC
    `, [sellerId]);

    // 3. Fetch Seller Adjustments
    const adjRes = await db.query(`
        SELECT *, 'IN_ADJ' as tx_type 
        FROM seller_adjustments 
        WHERE seller_id = $1
    `, [sellerId]);

    // 4. Combine and sort
    const allTransactions = [...transactions.rows, ...adjRes.rows].sort((a, b) => 
        new Date(b.date) - new Date(a.date) || new Date(b.created_at) - new Date(a.created_at)
    );

    // 5. Basic totals
    const openingStock = { type1: 0, type2: 0 };
    let t1 = 0, t2 = 0;
    transactions.rows.forEach(r => {
      t1 += (Number(r.type1) || 0);
      t2 += (Number(r.type2) || 0);
    });
    const closingStock = { type1: t1, type2: t2 };

    res.json({
      sellerId,
      sellerName,
      openingStock,
      closingStock,
      transactions: allTransactions
    });
  } catch (error) {
    console.error('Error generating seller report:', error);
    res.status(500).json({ error: 'Failed to generate seller report' });
  }
};
