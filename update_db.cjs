const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query("ALTER TABLE donors ADD COLUMN living_status VARCHAR(20) DEFAULT 'Living';");
    console.log("Column living_status added successfully.");
  } catch (err) {
    if (err.code === '42701') {
       console.log("Column living_status already exists.");
    } else {
       console.error("Error adding column:", err);
    }
  } finally {
    pool.end();
  }
}

run();
