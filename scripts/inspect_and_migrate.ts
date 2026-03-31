
import { pool } from "../config/database";

async function inspectPolicyProposals() {
    try {
        console.log("Searching policy_proposals...");
        const res = await pool.query(`
            SELECT * FROM policy_proposals WHERE title LIKE '%Kidney Transport Priority Policy 2025%'
        `);
        console.log("Found in proposals:", res.rows);

        if (res.rows.length > 0) {
            const proposal = res.rows[0];
            console.log("Proposal Data:", proposal);

            // Check if it exists in 'policies'
            const existing = await pool.query("SELECT * FROM policies WHERE policy_id = $1", [proposal.id]);
            if (existing.rows.length === 0) {
                console.log("Migrating to 'policies' table...");
                // Insert with same ID if possible
                try {
                    await pool.query(
                        `INSERT INTO policies (policy_id, proposer_org_id, title, description, status, created_at, yes_votes, no_votes)
                     VALUES ($1, $2, $3, $4, 'Active', $5, 3, 1)
                     ON CONFLICT (policy_id) DO UPDATE SET status = 'Active', yes_votes = 3`,
                        [proposal.id, proposal.proposer_id, proposal.title, proposal.description, proposal.created_at]
                    );
                    console.log("Migrated and Activated.");
                } catch (e) { console.error("Migration failed:", e); }
            } else {
                console.log("Already exists in policies. Updating status...");
                await pool.query("UPDATE policies SET status = 'Active', yes_votes = 3 WHERE policy_id = $1", [proposal.id]);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

inspectPolicyProposals();
