const db = require('../config/db');

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

exports.createAdjustment = async (req, res) => {
  try {
    const { seller_id, amount, date, remark } = req.body;
    const result = await db.query(
      'INSERT INTO seller_adjustments (seller_id, amount, date, remark) VALUES ($1, $2, $3, $4) RETURNING *',
      [seller_id, amount, date, toTitleCase(remark)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating seller adjustment:', error);
    res.status(500).json({ error: 'Failed to create adjustment' });
  }
};

exports.getAdjustmentsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const result = await db.query('SELECT * FROM seller_adjustments WHERE seller_id = $1', [sellerId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching seller adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch adjustments' });
  }
};

exports.updateAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, remark } = req.body;
    const result = await db.query(
      'UPDATE seller_adjustments SET amount = $1, date = $2, remark = $3 WHERE id = $4 RETURNING *',
      [amount, date, toTitleCase(remark), id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating seller adjustment:', error);
    res.status(500).json({ error: 'Failed to update adjustment' });
  }
};

exports.deleteAdjustment = async (req, res) => {
  const { id } = req.params;
  const delPass = req.headers['x-delete-password'];
  if (delPass !== process.env.del_pass) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  try {
    const result = await db.query('DELETE FROM seller_adjustments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }
    res.json({ message: 'Adjustment deleted successfully' });
  } catch (error) {
    console.error('Error deleting seller adjustment:', error);
    res.status(500).json({ error: 'Failed to delete adjustment' });
  }
};
