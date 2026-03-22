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
