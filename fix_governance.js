
import { pool } from './config/database.js';

async function fixGovernance() {
    const client = await pool.connect();
    try {
        console.log('--- SYNCING GOVERNANCE ---');
        
        // 1. Update Patient Advocacy Board Login
        const pabData = await client.query('SELECT organization_id FROM organizations WHERE LOWER(email) = LOWER($1) OR name = $2', ['PAB', 'Patient Advocacy Board']);
        if (pabData.rows.length > 0) {
            const orgId = pabData.rows[0].organization_id;
            await client.query('UPDATE organizations SET email = $1, name = $2 WHERE organization_id = $3', ['pab@test.com', 'Patient Advocacy Board', orgId]);
            console.log('✅ Updated PAB account: Email = pab@test.com');
        } else {
            console.log('❌ PAB account not found.');
        }

        // 2. Fix Policy 20 Activation
        // Ensure proposer's vote exists and status is 'Active'
        const policyId = 20; 
        const proposerId = 4; // Org 4 is proposer of ID 20

        // Check columns of policy_votes
        const columnsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'policy_votes'");
        const columns = columnsRes.rows.map(r => r.column_name);
        console.log('Columns in policy_votes:', columns.join(', '));

        // Use the columns found to insert the vote if missing
        const hasCreated = columns.includes('created_at');
        const hasOrgId = columns.includes('organization_id');
        
        if (hasOrgId) {
            await client.query(`
                INSERT INTO policy_votes (policy_id, organization_id, vote ${hasCreated ? ', created_at' : ''})
                VALUES ($1, $2, true ${hasCreated ? ', NOW()' : ''})
                ON CONFLICT (policy_id, organization_id) DO NOTHING
            `, [policyId, proposerId]);
            console.log('✅ Proposer vote synced.');
        }

        // Final Activation
        await client.query(`UPDATE policies SET status = 'Active', updated_at = NOW() WHERE policy_id = $1`, [policyId]);
        console.log('✅ Policy 20 set to ACTIVE.');

    } catch (err) {
        console.error('Failed to fix governance:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixGovernance();
