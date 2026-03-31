
import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

async function criticalFix() {
    console.log('--- CRITICAL RECONCILIATION ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const client = await pool.connect();
    try {
        // 1. Audit Policy 20
        const pRes = await client.query("SELECT policy_id, title, status FROM policies WHERE title LIKE '%Liver Distance%'");
        if (pRes.rows.length > 0) {
            const pid = pRes.rows[0].policy_id;
            await client.query("UPDATE policies SET status = 'Active' WHERE policy_id = $1", [pid]);
            console.log(`✅ Policy ${pid} forced to 'Active'.`);
        }

        // 2. Audit PAB Login
        // Clone from orga@test.com again to be absolutely sure
        const orga = await client.query("SELECT password_hash FROM organizations WHERE email = 'orga@test.com'");
        if (orga.rows.length > 0) {
            const goodHash = orga.rows[0].password_hash;
            
            // Delete ALL instances of pab or Patient Advocacy Board
            await client.query("DELETE FROM organizations WHERE LOWER(email) = 'pab@test.com'");
            await client.query("DELETE FROM organizations WHERE name LIKE '%Advocacy%'");
            
            // Insert fresh with the GOOD hash
            const insertRes = await client.query(`
                INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                VALUES ($1, $2, $3, $4, true, NOW())
                RETURNING organization_id
            `, ['Patient Advocacy Board', 'pab@test.com', goodHash, 'Patient Representative cross-check']);
            
            const newId = insertRes.rows[0].organization_id;
            console.log(`✅ PAB Re-created with ID: ${newId} and Email: pab@test.com`);
            
            // 3. INTERNAL LOGIN TEST
            const testValid = await bcrypt.compare('org123', goodHash);
            console.log(`Self-Test Login ('org123'): ${testValid ? 'PASSED ✅' : 'FAILED ❌'}`);
        } else {
            console.log('❌ Could not find orga@test.com to clone.');
        }

    } catch (err) {
        console.error('Critical fix failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

criticalFix();
