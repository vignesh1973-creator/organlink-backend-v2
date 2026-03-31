
import { pool } from "../config/database.js";

async function runMigration() {
    try {
        console.log("🔌 Connecting to database...");
        const client = await pool.connect();

        console.log("🛠️ Adding 'voting_deadline' column...");
        await client.query("ALTER TABLE policies ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMP;");

        console.log("🛠️ Adding 'blockchain_policy_id' column...");
        await client.query("ALTER TABLE policies ADD COLUMN IF NOT EXISTS blockchain_policy_id INTEGER;");

        console.log("🛠️ Adding 'transaction_hash' column...");
        await client.query("ALTER TABLE policies ADD COLUMN IF NOT EXISTS transaction_hash TEXT;");

        console.log("✅ Schema update complete!");
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
