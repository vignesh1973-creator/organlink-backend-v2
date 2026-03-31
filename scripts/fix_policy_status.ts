
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function fixPolicies() {
    try {
        console.log("Checking for policies that met the new 50% threshold...");

        // Find policies that are 'Proposed' but have >= 2 votes
        // Strategy: We lowered threshold to 2 (50% of 4 voters)
        const res = await pool.query(`
            SELECT policy_id, title, votes_for 
            FROM policies 
            WHERE status = 'Proposed' AND votes_for >= 2
        `);

        if (res.rows.length === 0) {
            console.log("No stuck policies found.");
            return;
        }

        for (const row of res.rows) {
            console.log(`Fixing Policy #${row.policy_id}: "${row.title}" (Has ${row.votes_for} Yes Votes)`);
            await pool.query(`
                UPDATE policies SET status = 'Active', updated_at = NOW() 
                WHERE policy_id = $1
            `, [row.policy_id]);
            console.log(`✅ Set Policy #${row.policy_id} to ACTIVE.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

fixPolicies();
