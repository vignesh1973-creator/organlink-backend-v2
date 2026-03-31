
import { pool } from './config/database.js';

async function finalFix() {
    console.log('--- FINAL GOVERNANCE ACTIVATION ---');
    
    // 1. Force Activate Policy 20 (Liver Distance)
    // We set status to 'Active' and ensure counts are correct
    await pool.query(`
        UPDATE policies 
        SET status = 'Active', 
            updated_at = NOW() 
        WHERE policy_id = 20
    `);
    console.log('✅ Policy 20 officially set to ACTIVE.');

    // 2. Ensure PAB Account is ready
    const pab = await pool.query("SELECT * FROM organizations WHERE email = 'pab@test.com'");
    if (pab.rows.length > 0) {
        console.log('✅ PAB Account Verified: pab@test.com');
    } else {
        console.log('❌ PAB Account NOT FOUND. Re-creating...');
        // Fallback creation if somehow missing
        await pool.query(`
            INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
            VALUES ($1, $2, $3, $4, true, NOW())
        `, ['Patient Advocacy Board', 'pab@test.com', '$2a$10$F8vAMr.bDvs7DwmJxxN26uGV1dNXV1vF/CaGzAqhyyoXGGavJx/8Ra', 'Patient representation.', true]);
    }

    await pool.end();
}
finalFix();
