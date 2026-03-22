const db = require('../config/db');

exports.createAdjustment = async (req, res) => {
  try {
    const { seller_id, amount, date, remark } = req.body;
    const result = await db.query(
      'INSERT INTO seller_adjustments (seller_id, amount, date, remark) VALUES ($1, $2, $3, $4) RETURNING *',
      [seller_id, amount, date, remark]
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
      [amount, date, remark, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating seller adjustment:', error);
    res.status(500).json({ error: 'Failed to update adjustment' });
  }
};

exports.deleteAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM seller_adjustments WHERE id = $1', [id]);
    res.json({ message: 'Adjustment deleted successfully' });
  } catch (error) {
    console.error('Error deleting seller adjustment:', error);
    res.status(500).json({ error: 'Failed to delete adjustment' });
  }
};
