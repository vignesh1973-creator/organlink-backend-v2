import { pool } from "../config/database.js";

async function fixSchema() {
    try {
        console.log("Starting schema fix for policy_votes...");

        // 1. Drop the incorrect constraint
        console.log("Dropping old constraint...");
        await pool.query(`
      ALTER TABLE policy_votes 
      DROP CONSTRAINT IF EXISTS policy_votes_policy_id_fkey;
    `);

        // 2. Add the correct constraint referencing policy_proposals
        console.log("Adding new constraint referencing policy_proposals(id)...");
        await pool.query(`
      ALTER TABLE policy_votes 
      ADD CONSTRAINT policy_votes_policy_id_fkey 
      FOREIGN KEY (policy_id) 
      REFERENCES policy_proposals(id)
      ON DELETE CASCADE;
    `);

        console.log("Schema fix completed successfully!");
    } catch (error) {
        console.error("Schema fix failed:", error);
    } finally {
        pool.end();
    }
}

fixSchema();
