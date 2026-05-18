const db = require('../config/db');

// GET /api/stock/jobber/:jobberId
exports.getJobberStock = async (req, res) => {
    const { jobberId } = req.params;

    try {
        // Sum IN (transactions_in + material_transfers as receiver)
        const inResult = await db.query(`
            SELECT 
                SUM(type1) as total_in_type1, 
                SUM(type2) as total_in_type2 
            FROM (
                SELECT type1, type2 FROM transactions_in WHERE jobber_id = $1 AND NOT COALESCE(a, FALSE)
                UNION ALL
                SELECT type1, type2 FROM material_transfers WHERE to_jobber_id = $1
            ) combined_in
        `, [jobberId]);

        // Sum OUT (transactions_out + material_transfers as sender)
        const outResult = await db.query(`
            SELECT 
                SUM(type1) as total_out_type1, 
                SUM(type2) as total_out_type2 
            FROM (
                SELECT type1, type2 FROM transactions_out WHERE jobber_id = $1 AND NOT COALESCE(a, FALSE)
                UNION ALL
                SELECT type1, type2 FROM material_transfers WHERE from_jobber_id = $1
            ) combined_out
        `, [jobberId]);

        const inData = inResult.rows[0];
        const outData = outResult.rows[0];

        res.json({
            total_in_type1: Number(inData.total_in_type1) || 0,
            total_in_type2: Number(inData.total_in_type2) || 0,
            total_out_type1: Number(outData.total_out_type1) || 0,
            total_out_type2: Number(outData.total_out_type2) || 0
        });
    } catch (err) {
        console.error('Error calculating jobber stock:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
