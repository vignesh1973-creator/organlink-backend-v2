
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env - assume running from backend root
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkCounts() {
    try {
        const d = await pool.query("SELECT COUNT(*) FROM donors");
        const p = await pool.query("SELECT COUNT(*) FROM patients");
        console.log(`Donors: ${d.rows[0].count}`);
        console.log(`Patients: ${p.rows[0].count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkCounts();
