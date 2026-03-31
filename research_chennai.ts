
import { pool } from './config/database.js';

async function findChennai() {
    console.log('--- FINDING CHENNAI ---');
    const res = await pool.query("SELECT hospital_id, name, location FROM hospitals WHERE location ILIKE '%Chennai%' OR name ILIKE '%Chennai%'");
    console.log(JSON.stringify(res.rows));
    
    // Also check patient schema
    const colRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients'");
    console.log('Patient Columns:', colRes.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    
    await pool.end();
}
findChennai();
