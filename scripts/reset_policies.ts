
import { pool } from "../config/database";

async function resetPolicyData() {
    try {
        console.log("Resetting all policy data...");
        // Order matters for FK constraints
        await pool.query("TRUNCATE TABLE policy_votes CASCADE");
        await pool.query("TRUNCATE TABLE policies CASCADE");
        // Also check policy_proposals just in case
        await pool.query("TRUNCATE TABLE policy_proposals CASCADE");

        console.log("All policies and votes cleared.");
    } catch (e) {
        // Ignore "relation does not exist" for tables we might not have
        if ((e as any).code === '42P01') {
            console.log("Table missing, continuing...");
        } else {
            console.error(e);
        }
    } finally {
        pool.end();
    }
}

resetPolicyData();
