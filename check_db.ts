
import { pool } from './config/database.js';

async function checkOrgs() {
    const res = await pool.query('SELECT organization_id, name, email FROM organizations');
    console.log('ORGS:', JSON.stringify(res.rows));
    const votesRes = await pool.query('SELECT * FROM policy_votes LIMIT 1');
    console.log('VOTES_COLS:', Object.keys(votesRes.rows[0] || {}).join(', '));
    await pool.end();
}
checkOrgs();
