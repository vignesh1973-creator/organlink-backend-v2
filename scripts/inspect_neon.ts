
import { Pool } from "pg";

const connectionString = "postgresql://neondb_owner:npg_gV6OIzYPR0Jh@ep-quiet-thunder-adtsc7t7-pooler.c-2.us-east-1.aws.neon.tech/organlink_db?sslmode=require&channel_binding=require";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspectNeon() {
    try {
        console.log("Connecting to Neon...");

        // Check ALL policies
        const res = await pool.query("SELECT * FROM policies LIMIT 10");
        console.log("Policies in Neon:");
        console.table(res.rows.map(r => ({
            id: r.policy_id,
            title: r.title,
            status: r.status,
            yes: r.yes_votes,
            created: r.created_at
        })));

        // Find ghost
        const ghost = res.rows.find(r => r.policy_id === 1);
        if (ghost) {
            console.log("Found Ghost Policy #1. Updating...");
            await pool.query("UPDATE policies SET status = 'Active', yes_votes = 3 WHERE policy_id = 1");
            console.log("Updated Ghost Policy in Neon.");
        } else {
            console.log("Policy #1 NOT found in policies table.");
            // Check proposals
            const props = await pool.query("SELECT * FROM policy_proposals LIMIT 10");
            console.log("Proposals in Neon:");
            console.table(props.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

inspectNeon();
