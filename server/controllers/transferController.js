const db = require('../config/db');

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Validation helper to check if ID exists in jobbers table
const validateJobberId = async (id) => {
    const result = await db.query('SELECT id FROM jobbers WHERE id = $1', [id]);
    return result.rows.length > 0;
};

// ─── GET /api/transactions/transfer ──────────────────────────────────────────
exports.getAllTransfers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, 
                   COALESCE(fj.name, '') as from_jobber, 
                   COALESCE(tj.name, '') as to_jobber 
            FROM material_transfers t
            LEFT JOIN jobbers fj ON t.from_jobber_id = fj.id
            LEFT JOIN jobbers tj ON t.to_jobber_id = tj.id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all material transfers:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── POST /api/transactions/transfer ─────────────────────────────────────────
exports.createTransfer = async (req, res) => {
    const { 
        from_jobber_id, to_jobber_id, type1, type2, material, date, remark 
    } = req.body;

    if (!from_jobber_id || !to_jobber_id || !material || !date) {
        return res.status(400).json({ error: 'from_jobber_id, to_jobber_id, material, and date are required' });
    }

    if (from_jobber_id === to_jobber_id) {
        return res.status(400).json({ error: 'From Jobber and To Jobber cannot be the same' });
    }

    const t1 = Number(type1) || 0;
    const t2 = Number(type2) || 0;

    if (t1 <= 0 && t2 <= 0) {
        return res.status(400).json({ error: 'At least one quantity (Type 1 or Type 2) must be greater than zero' });
    }

    if (t1 < 0 || t2 < 0) {
        return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    if (t1 > 0 && t2 > 0) {
        return res.status(400).json({ error: 'Type 1 and Type 2 quantities are mutually exclusive' });
    }

    try {
        // Validate existence of both jobbers
        if (!await validateJobberId(from_jobber_id)) return res.status(400).json({ error: 'Invalid from_jobber_id' });
        if (!await validateJobberId(to_jobber_id)) return res.status(400).json({ error: 'Invalid to_jobber_id' });

        const query = `
            INSERT INTO material_transfers 
            (from_jobber_id, to_jobber_id, type1, type2, material, date, remark)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            from_jobber_id, to_jobber_id, t1, t2, toTitleCase(material), 
            date, toTitleCase(remark)
        ];

        const result = await db.query(query, values);
        
        // Fetch full transfer with jobber names to return to front-end
        const fullResult = await db.query(`
            SELECT t.*, 
                   COALESCE(fj.name, '') as from_jobber, 
                   COALESCE(tj.name, '') as to_jobber 
            FROM material_transfers t
            LEFT JOIN jobbers fj ON t.from_jobber_id = fj.id
            LEFT JOIN jobbers tj ON t.to_jobber_id = tj.id
            WHERE t.id = $1
        `, [result.rows[0].id]);

        res.status(201).json(fullResult.rows[0]);
    } catch (err) {
        console.error('Error creating material transfer:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── UPDATE /api/transactions/transfer/:id ───────────────────────────────────
exports.updateTransfer = async (req, res) => {
    const { id } = req.params;
    const { from_jobber_id, to_jobber_id, type1, type2, material, date, remark } = req.body;

    if (!from_jobber_id || !to_jobber_id || !material || !date) {
        return res.status(400).json({ error: 'from_jobber_id, to_jobber_id, material, and date are required' });
    }

    if (from_jobber_id === to_jobber_id) {
        return res.status(400).json({ error: 'From Jobber and To Jobber cannot be the same' });
    }

    const t1 = Number(type1) || 0;
    const t2 = Number(type2) || 0;

    if (t1 <= 0 && t2 <= 0) {
        return res.status(400).json({ error: 'At least one quantity (Type 1 or Type 2) must be greater than zero' });
    }

    if (t1 < 0 || t2 < 0) {
        return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    if (t1 > 0 && t2 > 0) {
        return res.status(400).json({ error: 'Type 1 and Type 2 quantities are mutually exclusive' });
    }

    try {
        if (!await validateJobberId(from_jobber_id)) return res.status(400).json({ error: 'Invalid from_jobber_id' });
        if (!await validateJobberId(to_jobber_id)) return res.status(400).json({ error: 'Invalid to_jobber_id' });

        const query = `
            UPDATE material_transfers 
            SET from_jobber_id=$1, to_jobber_id=$2, type1=$3, type2=$4, material=$5, date=$6, remark=$7
            WHERE id=$8 RETURNING *
        `;
        const values = [from_jobber_id, to_jobber_id, t1, t2, toTitleCase(material), date, toTitleCase(remark), id];
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });
        
        // Fetch full transfer with names
        const fullResult = await db.query(`
            SELECT t.*, 
                   COALESCE(fj.name, '') as from_jobber, 
                   COALESCE(tj.name, '') as to_jobber 
            FROM material_transfers t
            LEFT JOIN jobbers fj ON t.from_jobber_id = fj.id
            LEFT JOIN jobbers tj ON t.to_jobber_id = tj.id
            WHERE t.id = $1
        `, [id]);

        res.json(fullResult.rows[0]);
    } catch (err) {
        console.error('Error updating material transfer:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── DELETE /api/transactions/transfer/:id ───────────────────────────────────
exports.deleteTransfer = async (req, res) => {
    const { id } = req.params;
    const delPass = req.headers['x-delete-password'];
    if (delPass !== process.env.del_pass) return res.status(401).json({ message: 'Invalid password' });

    try {
        const result = await db.query('DELETE FROM material_transfers WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting material transfer:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
