import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
    const res = await pool.query('SELECT hospital_id, name, city, email FROM hospitals');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}
check();
