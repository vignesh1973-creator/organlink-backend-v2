import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function inspect() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected!');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\nTables in Database:');
    res.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check patients count
    const pRes = await client.query('SELECT COUNT(*) FROM patients');
    console.log(`\nTotal Patients: ${pRes.rows[0].count}`);

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

inspect();
