
import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

async function absoluteFinalFix() {
    console.log('--- FINAL GOVERNANCE SYNCHRONIZATION ---');
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Force Activate Policy 20 (Liver Distance Minimization Act)
        // Ensure its status is 'Active' in the database
        const updatePolicy = await client.query(`
            UPDATE policies 
            SET status = 'Active', 
                updated_at = NOW() 
            WHERE policy_id = 20
            RETURNING status
        `);
        if (updatePolicy.rowCount > 0) {
            console.log('✅ Policy 20 status changed to:', updatePolicy.rows[0].status);
        } else {
            console.log('⚠️ Policy 20 not found for status update.');
        }

        // 2. Setup Patient Advocacy Board (PAB) login
        const email = 'pab@test.com';
        const hashedPassword = await bcrypt.hash('org123', 10);
        
        // Remove any conflicting old accounts (cleanup)
        await client.query("DELETE FROM organizations WHERE email = 'PAB'");

        // Upsert the correct PAB account
        const checkPab = await client.query("SELECT organization_id FROM organizations WHERE email = $1", [email]);
        
        if (checkPab.rows.length === 0) {
            await client.query(`
                INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                VALUES ($1, $2, $3, $4, true, NOW())
            `, ['Patient Advocacy Board', email, hashedPassword, 'Independent patient representation for organ allocation.']);
            console.log('✅ Created PAB Account: Email = pab@test.com / Password = org123');
        } else {
            await client.query(`
                UPDATE organizations 
                SET name = $1, password_hash = $2, is_active = true 
                WHERE email = $3
            `, ['Patient Advocacy Board', hashedPassword, email]);
            console.log('✅ Updated PAB Account: Email = pab@test.com / Password = org123');
        }

        await client.query('COMMIT');
        console.log('--- SYNC COMPLETE ---');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Final fix failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

absoluteFinalFix();
