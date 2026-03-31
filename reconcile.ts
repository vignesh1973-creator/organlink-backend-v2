
import { pool } from './config/database.js';

async function diagnoseAndFix() {
    console.log('--- RECONCILIATION START ---');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Identify the Liver Policy ID
        const policyRes = await client.query("SELECT policy_id, title, status FROM policies WHERE title LIKE '%Liver Distance%'");
        if (policyRes.rows.length > 0) {
            const p = policyRes.rows[0];
            console.log(`Found Policy: "${p.title}" (ID: ${p.policy_id}) - Current Status: ${p.status}`);
            
            // Force it to 'Active' (capital A)
            await client.query("UPDATE policies SET status = 'Active' WHERE policy_id = $1", [p.policy_id]);
            console.log(`✅ Set Policy ${p.policy_id} to 'Active'`);
        } else {
            console.log('❌ Could not find Liver policy by title.');
        }

        // 2. Fix PAB Account - CLONING Organization A's hash for safety
        const orgARes = await client.query("SELECT password_hash FROM organizations WHERE email = 'orga@test.com'");
        if (orgARes.rows.length > 0) {
            const knownHash = orgARes.rows[0].password_hash;
            console.log('Cloning known-good hash from orga@test.com');

            // Delete existing PAB records to avoid duplicates
            await client.query("DELETE FROM organizations WHERE LOWER(email) = 'pab@test.com'");
            await client.query("DELETE FROM organizations WHERE name = 'Patient Advocacy Board'");
            
            // Insert fresh
            await client.query(`
                INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                VALUES ($1, $2, $3, $4, true, NOW())
            `, ['Patient Advocacy Board', 'pab@test.com', knownHash, 'Consortium Patient Representative']);
            
            console.log('✅ Re-created PAB: pab@test.com / org123 (Hash Cloned)');
        } else {
            console.log('❌ Could not find Organization A to clone hash.');
        }

        await client.query('COMMIT');
        console.log('--- RECONCILIATION COMPLETE ---');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Reconciliation failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

diagnoseAndFix();
