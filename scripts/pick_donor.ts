import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    const res = await pool.query('SELECT full_name, organlink_id, blood_type FROM donors WHERE hospital_id = \'HOSP76883068\' LIMIT 1');
    console.log(JSON.stringify(res.rows[0], null, 2));
    process.exit(0);
}
check();
