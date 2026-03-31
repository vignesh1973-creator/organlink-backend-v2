
import { Pool } from 'pg';

const neonUrl = "postgresql://neondb_owner:npg_gV6OIzYPR0Jh@ep-quiet-thunder-adtsc7t7-pooler.c-2.us-east-1.aws.neon.tech/organlink_db?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString: neonUrl,
    ssl: { rejectUnauthorized: false }
});

async function checkNeon() {
    try {
        console.log("Connecting to Neon DB...");
        const res = await pool.query("SELECT * FROM policies");
        console.table(res.rows);

        if (res.rows.length > 0) {
            console.log("⚠️ FOUND POLICIES IN NEON DB! The server is using this.");
            await pool.query("TRUNCATE TABLE policy_votes, policies RESTART IDENTITY CASCADE");
            console.log("✅ Wiped Neon DB.");
        } else {
            console.log("Neon DB is empty.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkNeon();
