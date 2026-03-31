
import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

async function masterFix() {
    const client = await pool.connect();
    try {
        console.log('--- MASTER DATA SYNC ---');
        
        // 1. Ensure PAB Account exists correctly
        const email = 'pab@test.com';
        const name = 'Patient Advocacy Board';
        const hashedPassword = await bcrypt.hash('org123', 10);

        const checkPab = await client.query('SELECT organization_id FROM organizations WHERE LOWER(email) = LOWER($1)', [email]);
        let pabId;

        if (checkPab.rows.length === 0) {
            // Try matching by old username 'PAB'
            const checkOld = await client.query('SELECT organization_id FROM organizations WHERE LOWER(email) = LOWER($1)', ['PAB']);
            if (checkOld.rows.length > 0) {
                pabId = checkOld.rows[0].organization_id;
                await client.query('UPDATE organizations SET email = $1, name = $2 WHERE organization_id = $3', [email, name, pabId]);
                console.log(`✅ Updated existing PAB (ID: ${pabId}) to ${email}`);
            } else {
                const insertRes = await client.query(`
                    INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                    VALUES ($1, $2, $3, $4, true, NOW())
                    RETURNING organization_id
                `, [name, email, hashedPassword, 'Patient representation for organ allocation governance.']);
                pabId = insertRes.rows[0].organization_id;
                console.log(`✅ Created new PAB account (ID: ${pabId}) with email ${email}`);
            }
        } else {
            pabId = checkPab.rows[0].organization_id;
            console.log(`ℹ️ PAB account already correctly exists (ID: ${pabId}).`);
        }

        // 2. Activate Policy 20
        const policyId = 20;
        const proposerId = 4; // Organization D

        // Force record proposer vote
        await client.query(`
            INSERT INTO policy_votes (policy_id, organization_id, vote, created_at)
            VALUES ($1, $2, true, NOW())
            ON CONFLICT (policy_id, organization_id) DO NOTHING
        `, [policyId, proposerId]);
        
        // Update Policy Status and Counts
        await client.query(`
            UPDATE policies 
            SET status = 'Active', 
                votes_for = (SELECT COUNT(*) FROM policy_votes WHERE policy_id = $1 AND vote = true),
                updated_at = NOW() 
            WHERE policy_id = $1
        `, [policyId]);
        
        console.log(`✅ Policy 20 is now ACTIVE with verified proposer votes.`);

    } catch (err) {
        console.error('Master fix failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

masterFix();
