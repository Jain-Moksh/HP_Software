const db = require('./config/db');
require('dotenv').config();

async function check() {
  try {
    const name = 'Gujarat';
    const s = await db.query('SELECT id FROM sellers WHERE name = $1', [name]);
    if (s.rows.length === 0) {
      console.log('Seller NOT FOUND');
      return;
    }
    const id = s.rows[0].id;
    console.log('Seller ID:', id);

    const tx = await db.query('SELECT * FROM transactions_in WHERE seller_id = $1', [id]);
    console.log('Total Transactions Found:', tx.rows.length);
    tx.rows.forEach(r => {
      console.log(`ID: ${r.id}, Date: ${r.date}, Month: ${new Date(r.date).getMonth()}, Year: ${new Date(r.date).getFullYear()}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
