import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function trim() {
    await pool.query("DELETE FROM donors WHERE donor_id IN (SELECT donor_id FROM donors WHERE hospital_id = 'HOSP76883068' LIMIT 1)");
    await pool.query("DELETE FROM donors WHERE donor_id IN (SELECT donor_id FROM donors WHERE hospital_id = 'HOSP09908226' LIMIT 1)");
    console.log("Trimmed one donor from each hospital to hit exactly 100/50.");
    process.exit(0);
}
trim();
