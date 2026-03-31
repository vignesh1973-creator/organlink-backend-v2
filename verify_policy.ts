
import 'dotenv/config';
import { pool } from './config/database.js';

async function verifyPolicy() {
    console.log('--- POLICY VERIFICATION ---');
    const res = await pool.query("SELECT * FROM policies WHERE title LIKE '%Liver Distance%'");
    console.log('POLICY:', JSON.stringify(res.rows, null, 2));
    await pool.end();
}
verifyPolicy();
