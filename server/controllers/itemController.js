const db = require('../config/db');

const toTitleCase = (str) => {
    if (!str) return '';
    return str.trim().toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// GET /api/items
exports.getItems = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM items ORDER BY item_name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/items
exports.createItem = async (req, res) => {
    const { item_name, description, job_rate, weight_type1, weight_type2 } = req.body;
    if (!item_name) return res.status(400).json({ error: 'Item Name is required' });

    try {
        const query = `
            INSERT INTO items (item_name, description, job_rate, weight_type1, weight_type2)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [
            toTitleCase(item_name),
            description ? toTitleCase(description) : '',
            Number(job_rate) || 0,
            Number(weight_type1) || 0,
            Number(weight_type2) || 0
        ];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Item already exists' });
        }
        console.error('Error creating item:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/items/:id
exports.updateItem = async (req, res) => {
    const { id } = req.params;
    const { item_name, description, job_rate, weight_type1, weight_type2 } = req.body;
    if (!item_name) return res.status(400).json({ error: 'Item Name is required' });

    try {
        const query = `
            UPDATE items 
            SET item_name = $1, description = $2, job_rate = $3, weight_type1 = $4, weight_type2 = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 RETURNING *
        `;
        const values = [
            toTitleCase(item_name),
            description ? toTitleCase(description) : '',
            Number(job_rate) || 0,
            Number(weight_type1) || 0,
            Number(weight_type2) || 0,
            id
        ];
        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Item already exists with this name' });
        }
        console.error('Error updating item:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/items/:id
exports.deleteItem = async (req, res) => {
    const { id } = req.params;
    const passwordFromBody = req.body.password;
    const passwordFromHeader = req.headers['x-delete-password'];
    const password = passwordFromBody || passwordFromHeader;

    if (password !== process.env.del_pass) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    try {
        const result = await db.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
