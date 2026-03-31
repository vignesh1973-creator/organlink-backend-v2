
import { pool } from './config/database.js';

async function syncPolicy20() {
    const client = await pool.connect();
    try {
        console.log('Syncing Policy 20 (Liver Distance minimization)...');
        // Policy 20 belongs to Org 4 (Global health/Transplant)
        const proposerId = 4;
        const policyId = 20;

        // Check if vote exists
        const check = await client.query('SELECT * FROM policy_votes WHERE policy_id = $1 AND organization_id = $2', [policyId, proposerId]);
        if (check.rows.length === 0) {
            await client.query(`
                INSERT INTO policy_votes (policy_id, organization_id, vote, created_at)
                VALUES ($1, $2, true, NOW())
            `, [policyId, proposerId]);
            console.log('✅ Proposer vote added.');
        }

        // Set status to Active since 4 YES votes are met
        await client.query(`UPDATE policies SET status = 'Active', updated_at = NOW() WHERE policy_id = $1`, [policyId]);
        console.log('✅ Policy 20 is now officially ACTIVE.');

    } catch (err) {
        console.error('Failed to sync policy:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

syncPolicy20();
