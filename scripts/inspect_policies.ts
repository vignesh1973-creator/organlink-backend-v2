import { pool } from "../config/database.js";

async function inspect() {
    try {
        console.log("Checking 'policies' table...");
        const resPolicies = await pool.query("SELECT * FROM policies");
        console.log(`'policies' row count: ${resPolicies.rowCount}`);
        if (resPolicies.rowCount > 0) console.log("First row:", resPolicies.rows[0]);

        console.log("\nChecking 'policy_proposals' table...");
        try {
            const resProposals = await pool.query("SELECT * FROM policy_proposals");
            console.log(`'policy_proposals' row count: ${resProposals.rowCount}`);
            if (resProposals.rowCount > 0) console.log("First row:", resProposals.rows[0]);
        } catch (e: any) {
            console.log(`'policy_proposals' ERROR: ${e.message}`);
        }

    } catch (err) {
        console.error("Global Error:", err);
    } finally {
        pool.end();
    }
}

inspect();
