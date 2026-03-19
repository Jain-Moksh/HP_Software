const db = require('../config/db');

// Get Job Report for a specific jobber
exports.getJobReport = async (req, res) => {
  try {
    const { jobber } = req.params;

    // 1. Fetch all transactions for that jobber
    const query = 'SELECT * FROM material_transactions WHERE jobber = $1 ORDER BY date ASC';
    const result = await db.query(query, [jobber]);
    const transactions = result.rows;

    // 2. Separate transactions: IN and OUT
    // 3. Calculate Opening Stock (Return 0 for now as per instructions)
    const openingStock = {
      type1: 0,
      type2: 0
    };

    // 4. Calculate totals and 5. Closing Stock
    let totalInType1 = 0;
    let totalInType2 = 0;
    let totalOutType1 = 0;
    let totalOutType2 = 0;

    transactions.forEach(tx => {
      const t1 = parseFloat(tx.type1) || 0;
      const t2 = parseFloat(tx.type2) || 0;

      if (tx.tx_type === 'IN') {
        totalInType1 += t1;
        totalInType2 += t2;
      } else if (tx.tx_type === 'OUT') {
        totalOutType1 += t1;
        totalOutType2 += t2;
      }
    });

    const closingStock = {
      type1: openingStock.type1 + totalInType1 - totalOutType1,
      type2: openingStock.type2 + totalInType2 - totalOutType2
    };

    res.status(200).json({
      openingStock,
      transactions,
      closingStock
    });
  } catch (error) {
    console.error('Error generating job report:', error);
    res.status(500).json({ error: 'Failed to generate job report' });
  }
};
