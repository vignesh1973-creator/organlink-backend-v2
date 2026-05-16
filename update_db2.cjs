const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query("ALTER TABLE donors ADD COLUMN condition_reason VARCHAR(100) DEFAULT 'Voluntary/Altruistic';");
    console.log("Column condition_reason added successfully.");
  } catch (err) {
    if (err.code === '42701') {
       console.log("Column condition_reason already exists.");
    } else {
       console.error("Error adding column:", err);
    }
  } finally {
    pool.end();
  }
}

run();
