
import { pool } from "../config/database.js";

async function diagnoseAndFix() {
    const client = await pool.connect();
    try {
        console.log("🔍 Checking 'policies' table schema...");

        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'policies';
    `);

        const columns = res.rows.map(r => r.column_name);
        console.log("📝 Current Columns:", columns.join(", "));

        const missingVotingDeadline = !columns.includes('voting_deadline');
        const missingBlockchainId = !columns.includes('blockchain_policy_id');
        const missingTxHash = !columns.includes('transaction_hash');

        if (missingVotingDeadline) {
            console.log("⚠️ 'voting_deadline' is MISSING. Adding it...");
            await client.query("ALTER TABLE policies ADD COLUMN voting_deadline TIMESTAMP;");
            console.log("✅ Added 'voting_deadline'.");
        } else {
            console.log("✅ 'voting_deadline' exists.");
        }

        if (missingBlockchainId) {
            console.log("⚠️ 'blockchain_policy_id' is MISSING. Adding it...");
            await client.query("ALTER TABLE policies ADD COLUMN blockchain_policy_id INTEGER;");
            console.log("✅ Added 'blockchain_policy_id'.");
        } else {
            console.log("✅ 'blockchain_policy_id' exists.");
        }

        if (missingTxHash) {
            console.log("⚠️ 'transaction_hash' is MISSING. Adding it...");
            await client.query("ALTER TABLE policies ADD COLUMN transaction_hash TEXT;");
            console.log("✅ Added 'transaction_hash'.");
        } else {
            console.log("✅ 'transaction_hash' exists.");
        }

    } catch (err) {
        console.error("❌ Diagnosis/Fix failed:", err);
    } finally {
        client.release();
        process.exit(0);
    }
}

diagnoseAndFix();
