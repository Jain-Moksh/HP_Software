const db = require('../config/db');

// GET /api/sellers
exports.getSellers = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM sellers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sellers:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// POST /api/sellers
exports.createSeller = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const result = await db.query(
            'INSERT INTO sellers (name) VALUES ($1) RETURNING *',
            [toTitleCase(name)]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Seller already exists' });
        }
        console.error('Error creating seller:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// DELETE /api/sellers/:id
exports.deleteSeller = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (password !== process.env.del_pass) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM seller_adjustments WHERE seller_id = $1', [id]);
        await client.query('DELETE FROM sellers WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.json({ message: 'Seller and all associated data deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting seller:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// PUT /api/sellers/:id
exports.updateSeller = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const result = await db.query(
            'UPDATE sellers SET name = $1 WHERE id = $2 RETURNING *',
            [toTitleCase(name), id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Seller not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Seller already exists with this name' });
        }
        console.error('Error updating seller:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

