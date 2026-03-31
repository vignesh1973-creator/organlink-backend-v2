
import pg from 'pg';
const { Pool } = pg;

// HARDCODED CONNECTION STRING to verify we hit the right one
// This matches the .env file exactly
const pool = new Pool({
    connectionString: "postgresql://postgres:4632@localhost:5432/organlink_local",
});

async function forceFix() {
    try {
        console.log("🔌 Connecting to [organlink_local]...");
        const client = await pool.connect();

        // VERIFY DB NAME
        const dbRes = await client.query("SELECT current_database()");
        console.log(`🎯 Connected to: ${dbRes.rows[0].current_database}`);

        console.log("🛠️ Adding 'voting_deadline' column...");
        await client.query("ALTER TABLE policies ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMP;");

        console.log("🛠️ Adding 'blockchain_policy_id' column...");
        await client.query("ALTER TABLE policies ADD COLUMN IF NOT EXISTS blockchain_policy_id INTEGER;");

        console.log("🛠️ Adding 'transaction_hash' column...");
        await client.query("ALTER TABLE policies ADD COLUMN IF NOT EXISTS transaction_hash TEXT;");

        console.log("✅ Schema update applied!");
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Fix failed:", err);
        process.exit(1);
    }
}

forceFix();
