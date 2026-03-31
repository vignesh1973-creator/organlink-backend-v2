
import 'dotenv/config';
import { pool } from './config/database.js';

async function checkPolicy() {
    console.log('--- DEFINITIVE POLICY CHECK ---');
    const res = await pool.query("SELECT policy_id, title, organ_type, status, policy_content FROM policies WHERE title LIKE '%Liver Distance%'");
    console.log('POLICY ROWS:', JSON.stringify(res.rows, null, 2));
    
    // Also check all Active policies
    const active = await pool.query("SELECT policy_id, title, organ_type, status FROM policies WHERE status = 'Active'");
    console.log('ALL ACTIVE POLICIES:', JSON.stringify(active.rows, null, 2));

    await pool.end();
}
checkPolicy();
