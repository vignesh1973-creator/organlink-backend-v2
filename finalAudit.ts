
import { pool } from './config/database.js';

async function finalAudit() {
    console.log('--- FINAL SYSTEM AUDIT ---');
    const client = await pool.connect();
    
    try {
        // 1. Audit Organizations
        const orgs = await client.query('SELECT organization_id, name, email, password_hash FROM organizations');
        console.log('Current Organizations:');
        orgs.rows.forEach(o => console.log(`- ID: ${o.organization_id}, Name: ${o.name}, Email: ${o.email}`));
        
        // Find a working hash from orga@test.com
        const orgA = orgs.rows.find(o => o.email.toLowerCase() === 'orga@test.com');
        if (orgA) {
            console.log(`✅ Using hash from ${orgA.email}`);
            
            // Delete duplicates and create PAB exactly
            await client.query("DELETE FROM organizations WHERE LOWER(email) = 'pab@test.com'");
            await client.query("DELETE FROM organizations WHERE name = 'Patient Advocacy Board'");
            
            await client.query(`
                INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                VALUES ($1, $2, $3, $4, true, NOW())
            `, ['Patient Advocacy Board', 'pab@test.com', orgA.password_hash, 'Patient Representative for consortium governance.']);
            console.log('✅ Finalized PAB: pab@test.com / org123');
        }

        // 2. Audit Policies
        const pols = await client.query('SELECT policy_id, title, status FROM policies');
        console.log('Current Policies:');
        pols.rows.forEach(p => console.log(`- ID: ${p.policy_id}, Title: ${p.title}, Status: ${p.status}`));
        
        const liverPolicy = pols.rows.find(p => p.title.includes('Liver Distance'));
        if (liverPolicy) {
            await client.query("UPDATE policies SET status = 'Active' WHERE policy_id = $1", [liverPolicy.policy_id]);
            console.log(`✅ Policy ${liverPolicy.policy_id} updated to ACTIVE.`);
        }

    } catch (err) {
        console.error('❌ Audit Failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

finalAudit();
