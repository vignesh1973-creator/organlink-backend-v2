
import { pool } from './config/database.js';

async function identifyChennai() {
    console.log('--- IDENTIFYING CHENNAI ---');
    const res = await pool.query("SELECT hospital_id, name, city FROM hospitals WHERE city ILIKE '%Chennai%' OR name ILIKE '%Chennai%'");
    console.log(JSON.stringify(res.rows));
    await pool.end();
}
identifyChennai();
