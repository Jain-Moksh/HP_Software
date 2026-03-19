const db = require('../config/db');

// Add Material Entry
exports.addMaterial = async (req, res) => {
  try {
    const {
      type1,
      type2,
      material,
      rate,
      seller,
      jobber,
      date,
      amount,
      w,
      b,
      a
    } = req.body;

    const query = `
      INSERT INTO material_transactions 
      (tx_type, type1, type2, material, rate, seller, jobber, date, amount, w, b, a)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      'IN', // Default tx_type for material-in
      type1 || 0,
      type2 || 0,
      material,
      rate || 0,
      seller,
      jobber,
      date,
      amount || 0,
      w || false,
      b || false,
      a || false
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding material:', error);
    res.status(500).json({ error: 'Failed to add material entry' });
  }
};

// Get All Material Entries
exports.getMaterials = async (req, res) => {
  try {
    const query = 'SELECT * FROM material_transactions ORDER BY date DESC, created_at DESC';
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch material entries' });
  }
};

// Get Distinct Jobbers
exports.getJobbers = async (req, res) => {
  try {
    const query = 'SELECT DISTINCT jobber FROM material_transactions WHERE jobber IS NOT NULL AND jobber != \'\'';
    const result = await db.query(query);
    const jobbers = result.rows.map(row => row.jobber);
    res.status(200).json(jobbers);
  } catch (error) {
    console.error('Error fetching jobbers:', error);
    res.status(500).json({ error: 'Failed to fetch jobbers' });
  }
};
