
import 'dotenv/config';
import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

async function finalDefinitiveFix() {
    console.log('--- FINAL DEFINITIVE RECONCILIATION ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Force Activate Policy (Liver Distance Minimization Act)
        // Ensure its status is 'Active' in BOTH fields if redundant
        const pRes = await client.query("SELECT policy_id, title, status FROM policies WHERE title LIKE '%Liver Distance%'");
        if (pRes.rows.length > 0) {
            const pid = pRes.rows[0].policy_id;
            await client.query("UPDATE policies SET status = 'Active', updated_at = NOW() WHERE policy_id = $1", [pid]);
            console.log(`✅ Policy ${pid} ("${pRes.rows[0].title}") forced to 'Active'.`);
        } else {
            console.log('❌ Could not find Liver policy by title.');
        }

        // 2. Setup PAB Account (Cloning from Org A)
        const orgaRes = await client.query("SELECT password_hash FROM organizations WHERE email = 'orga@test.com'");
        if (orgaRes.rows.length > 0) {
            const goodHash = orgaRes.rows[0].password_hash;
            
            // Delete ALL possible duplicates
            await client.query("DELETE FROM organizations WHERE LOWER(email) = 'pab@test.com'");
            await client.query("DELETE FROM organizations WHERE name LIKE '%Patient Advocacy%'");
            
            // Insert fresh with verified credentials
            await client.query(`
                INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                VALUES ($1, $2, $3, $4, true, NOW())
            `, ['Patient Advocacy Board', 'pab@test.com', goodHash, 'Patient Representative for consortium governance.']);
            
            console.log('✅ Finalized PAB: Email = pab@test.com / Password = org123 (Verified Hash)');
            
            // Internal Login Test
            const testValid = await bcrypt.compare('org123', goodHash);
            console.log(`Internal Self-Test ('org123'): ${testValid ? 'PASSED ✅' : 'FAILED ❌'}`);
        } else {
            console.log('❌ Could not find orga@test.com in the actual database.');
        }

        await client.query('COMMIT');
        console.log('--- ALL SYSTEMS SYNCHRONIZED ---');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Synchronous fix failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

finalDefinitiveFix();
