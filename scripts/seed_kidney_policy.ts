
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seedPolicy() {
    try {
        console.log("Restoring Kidney Policy...");

        // Check if exists
        const check = await pool.query("SELECT * FROM policies WHERE title LIKE '%Kidney%'");
        if (check.rows.length > 0) {
            console.log("Kidney Policy already exists (ID: " + check.rows[0].policy_id + "). Setting to Active.");
            await pool.query("UPDATE policies SET status = 'Active' WHERE policy_id = $1", [check.rows[0].policy_id]);
        } else {
            console.log("Creating new Kidney Policy...");
            const metrics = {
                distanceWeight: 20,
                urgencyWeight: 30,
                bloodMatchWeight: 40,
                timeWaitingWeight: 10
            };

            await pool.query(`
                INSERT INTO policies (
                    proposer_id, title, description, metrics, 
                    status, votes_for, votes_against, created_at, updated_at
                ) VALUES (
                    1, 
                    'Kidney Transport Priority Policy 2025', 
                    'Prioritize blood match and urgency for kidneys.', 
                    $1, 
                    'Active',
                    2, 0, NOW(), NOW()
                )
            `, [JSON.stringify(metrics)]);
            console.log("✅ Created 'Kidney Transport Priority Policy 2025' [ACTIVE]");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

seedPolicy();
