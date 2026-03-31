const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function ageDonors() {
  try {
    const client = await pool.connect();
    
    // Get some donors
    const res = await client.query('SELECT donor_id, full_name FROM donors ORDER BY registration_date DESC LIMIT 10');
    if (res.rows.length < 4) {
      console.log("Not enough donors to age.");
      return;
    }

    // Set 2 to Orange (35 days ago)
    const orangeDate = new Date();
    orangeDate.setDate(orangeDate.getDate() - 35);
    await client.query('UPDATE donors SET last_check_in = $1 WHERE donor_id IN ($2, $3)', [orangeDate, res.rows[0].donor_id, res.rows[1].donor_id]);
    console.log(`Updated Orange: ${res.rows[0].full_name}, ${res.rows[1].full_name}`);

    // Set 2 to Red (65 days ago)
    const redDate = new Date();
    redDate.setDate(redDate.getDate() - 65);
    await client.query('UPDATE donors SET last_check_in = $1 WHERE donor_id IN ($2, $3)', [redDate, res.rows[2].donor_id, res.rows[3].donor_id]);
    console.log(`Updated Red: ${res.rows[2].full_name}, ${res.rows[3].full_name}`);

    client.release();
    console.log("Database aged successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

ageDonors();
