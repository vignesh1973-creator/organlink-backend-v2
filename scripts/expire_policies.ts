import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function expirePolicies() {
    try {
        console.log("Expiring old Proposed and approved policies...");
        const res = await pool.query("UPDATE policies SET status = 'Expired' WHERE status IN ('Proposed', 'approved')");
        console.log(`Updated ${res.rowCount} policies to Expired.`);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

expirePolicies();
