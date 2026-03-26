const db = require('../config/db');

// GET /api/jobbers
exports.getJobbers = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM jobbers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching jobbers:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// POST /api/jobbers
exports.createJobber = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const result = await db.query(
            'INSERT INTO jobbers (name) VALUES ($1) RETURNING *',
            [toTitleCase(name)]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Jobber already exists' });
        }
        console.error('Error creating jobber:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// DELETE /api/jobbers/:id
exports.deleteJobber = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (password !== process.env.del_pass) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Delete adjustments first (manual cascade if not in schema)
        await client.query('DELETE FROM jobber_adjustments WHERE jobber_id = $1', [id]);
        // Delete jobber (this will cascade to transactions_in and transactions_out)
        await client.query('DELETE FROM jobbers WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.json({ message: 'Jobber and all associated data deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting jobber:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};
