
import 'dotenv/config';
import { pool } from '../config/database.js';

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organizations';
    `);
        console.table(res.rows);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
