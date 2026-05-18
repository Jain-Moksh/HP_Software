const db = require('../config/db');

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// POST /api/adjustments
exports.createAdjustment = async (req, res) => {
    const { jobber_id, amount, date, remark } = req.body;
    if (!jobber_id || !amount || !date) {
        return res.status(400).json({ error: 'Jobber ID, Amount, and Date are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO jobber_adjustments (jobber_id, amount, date, remark) VALUES ($1, $2, $3, $4) RETURNING *',
            [jobber_id, amount, date, toTitleCase(remark)]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating adjustment:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/adjustments/jobber/:jobberId
exports.getAdjustmentsByJobber = async (req, res) => {
    const { jobberId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM jobber_adjustments WHERE jobber_id = $1 ORDER BY date DESC',
            [jobberId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching adjustments:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/adjustments/:id
exports.updateAdjustment = async (req, res) => {
    const { id } = req.params;
    const { amount, date, remark } = req.body;
    if (amount === undefined || amount === null || !date) {
        return res.status(400).json({ error: 'Amount and Date are required' });
    }
    try {
        const result = await db.query(
            'UPDATE jobber_adjustments SET amount=$1, date=$2, remark=$3 WHERE id=$4 RETURNING *',
            [amount, date, toTitleCase(remark), id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Adjustment not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating adjustment:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/adjustments/:id
exports.deleteAdjustment = async (req, res) => {
    const { id } = req.params;
    const delPass = req.headers['x-delete-password'];
    if (delPass !== process.env.del_pass) return res.status(401).json({ message: 'Invalid password' });

    try {
        const result = await db.query('DELETE FROM jobber_adjustments WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Adjustment not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting adjustment:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
