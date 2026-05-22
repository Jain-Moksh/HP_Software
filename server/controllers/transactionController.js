const db = require('../config/db');

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// ─── GET /api/transactions/in ───────────────────────────────────────────────
exports.getAllTransactionsIn = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, 
                   COALESCE(j.name, '') as jobber, 
                   COALESCE(s.name, '') as seller 
            FROM transactions_in t
            LEFT JOIN jobbers j ON t.jobber_id = j.id
            LEFT JOIN sellers s ON t.seller_id = s.id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all transactions in:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/transactions/out ──────────────────────────────────────────────
exports.getAllTransactionsOut = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, 
                   COALESCE(j.name, '') as jobber, 
                   COALESCE(v.name, '') as vendor
            FROM transactions_out t
            LEFT JOIN jobbers j ON t.jobber_id = j.id
            LEFT JOIN vendors v ON t.vendor_id = v.id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all transactions out:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validation helper to check if ID exists in a table
const validateId = async (table, id) => {
    const result = await db.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
    return result.rows.length > 0;
};

// ─── POST /api/transactions/in ──────────────────────────────────────────────
exports.createTransactionIn = async (req, res) => {
    const { 
        jobber_id, seller_id, type1, type2, material, 
        rate, amount, date, remark, w, b, a 
    } = req.body;

    if (!jobber_id || !seller_id || !date) {
        return res.status(400).json({ error: 'jobber_id, seller_id, and date are required' });
    }

    try {
        // Validate existence
        if (!await validateId('jobbers', jobber_id)) return res.status(400).json({ error: 'Invalid jobber_id' });
        if (!await validateId('sellers', seller_id)) return res.status(400).json({ error: 'Invalid seller_id' });

        const query = `
            INSERT INTO transactions_in 
            (jobber_id, seller_id, type1, type2, material, rate, amount, date, remark, w, b, a)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const values = [
            jobber_id, seller_id, type1 || 0, type2 || 0, toTitleCase(material), 
            rate || 0, amount || 0, date, toTitleCase(remark), w || false, b || false, a || false
        ];

        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating transaction in:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/transactions/out ─────────────────────────────────────────────
exports.createTransactionOut = async (req, res) => {
    const { 
        jobber_id, vendor_id, type1, type2, type1_b, type2_b, material, 
        rate, amount, date, remark, w, b, a 
    } = req.body;

    if (!jobber_id || !vendor_id || !date) {
        return res.status(400).json({ error: 'jobber_id, vendor_id, and date are required' });
    }

    try {
        if (!await validateId('jobbers', jobber_id)) return res.status(400).json({ error: 'Invalid jobber_id' });
        if (!await validateId('vendors', vendor_id)) return res.status(400).json({ error: 'Invalid vendor_id' });

        const query = `
            INSERT INTO transactions_out
            (jobber_id, vendor_id, type1, type2, type1_b, type2_b, material, rate, amount, date, remark, w, b, a)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        const values = [
            jobber_id, vendor_id, type1 || 0, type2 || 0, type1_b || 0, type2_b || 0,
            toTitleCase(material), rate || 0, amount || 0, date,
            toTitleCase(remark), w || false, b || false, a || false
        ];

        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating transaction out:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/transactions/in/:jobberId ──────────────────────────────────────
exports.getInTransactionsByJobber = async (req, res) => {
    const { jobberId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM transactions_in WHERE jobber_id = $1 ORDER BY created_at DESC',
            [jobberId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions in by jobber:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/transactions/out/:jobberId ─────────────────────────────────────
exports.getOutTransactionsByJobber = async (req, res) => {
    const { jobberId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM transactions_out WHERE jobber_id = $1 ORDER BY created_at DESC',
            [jobberId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions out by jobber:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/transactions/seller/:sellerId ──────────────────────────────────
exports.getTransactionsBySeller = async (req, res) => {
    const { sellerId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM transactions_in WHERE seller_id = $1 ORDER BY created_at DESC',
            [sellerId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions by seller:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── GET /api/transactions/vendor/:vendorId ──────────────────────────────────
exports.getTransactionsByVendor = async (req, res) => {
    const { vendorId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM transactions_out WHERE vendor_id = $1 ORDER BY created_at DESC',
            [vendorId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions by vendor:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── UPDATE /api/transactions/in/:id ───────────────────────────────────────
exports.updateTransactionIn = async (req, res) => {
    const { id } = req.params;
    const { jobber_id, seller_id, type1, type2, material, rate, amount, date, remark, w, b, a } = req.body;
    try {
        const result = await db.query(`
            UPDATE transactions_in 
            SET jobber_id=$1, seller_id=$2, type1=$3, type2=$4, material=$5, rate=$6, amount=$7, date=$8, remark=$9, w=$10, b=$11, a=$12
            WHERE id=$13 RETURNING *
        `, [jobber_id, seller_id, type1, type2, toTitleCase(material), rate, amount, date, toTitleCase(remark), w, b, a, id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating transaction in:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── DELETE /api/transactions/in/:id ───────────────────────────────────────
exports.deleteTransactionIn = async (req, res) => {
    const { id } = req.params;
    const delPass = req.headers['x-delete-password'];
    if (delPass !== process.env.del_pass) return res.status(401).json({ message: 'Invalid password' });

    try {
        const result = await db.query('DELETE FROM transactions_in WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting transaction in:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── UPDATE /api/transactions/out/:id ───────────────────────────────────────
exports.updateTransactionOut = async (req, res) => {
    const { id } = req.params;
    const { jobber_id, vendor_id, type1, type2, type1_b, type2_b, material, rate, amount, date, remark, w, b, a } = req.body;
    try {
        const result = await db.query(`
            UPDATE transactions_out 
            SET jobber_id=$1, vendor_id=$2, type1=$3, type2=$4, type1_b=$5, type2_b=$6,
                material=$7, rate=$8, amount=$9, date=$10, remark=$11, w=$12, b=$13, a=$14
            WHERE id=$15 RETURNING *
        `, [jobber_id, vendor_id, type1, type2, type1_b || 0, type2_b || 0,
            toTitleCase(material), rate, amount, date, toTitleCase(remark), w, b, a, id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating transaction out:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── DELETE /api/transactions/out/:id ──────────────────────────────────────
exports.deleteTransactionOut = async (req, res) => {
    const { id } = req.params;
    const delPass = req.headers['x-delete-password'];
    if (delPass !== process.env.del_pass) return res.status(401).json({ message: 'Invalid password' });

    try {
        const result = await db.query('DELETE FROM transactions_out WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting transaction out:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
