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
