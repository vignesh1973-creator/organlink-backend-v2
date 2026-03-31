
import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

async function definitiveFix() {
    console.log('--- DEFINITIVE SYNCHRONIZATION ---');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // A. Fix Policy 20 Activation
        // 1. Get current columns of policies
        const colRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'policies'");
        const columns = colRes.rows.map(r => r.column_name);
        console.log('Actual columns in policies table:', columns.join(', '));
        
        const hasUpdatedAt = columns.includes('updated_at');
        
        // 2. Perform safe update
        const updateSql = `UPDATE policies SET status = 'Active' ${hasUpdatedAt ? ', updated_at = NOW()' : ''} WHERE policy_id = 20`;
        await client.query(updateSql);
        console.log('✅ Policy 20 forced to Active.');

        // B. Fix PAB Account for Login
        const email = 'pab@test.com';
        const name = 'Patient Advocacy Board';
        const hashedPassword = await bcrypt.hash('org123', 10);

        // Delete any old incomplete records
        await client.query("DELETE FROM organizations WHERE email = 'PAB'");
        
        const checkRes = await client.query("SELECT organization_id FROM organizations WHERE email = $1", [email]);
        
        if (checkRes.rows.length === 0) {
            await client.query(`
                INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                VALUES ($1, $2, $3, $4, true, NOW())
            `, [name, email, hashedPassword, 'Patient representation for consortium governance.']);
            console.log('✅ Created PAB Account: pab@test.com / org123');
        } else {
            await client.query(`
                UPDATE organizations 
                SET name = $1, password_hash = $2, is_active = true 
                WHERE email = $3
            `, [name, hashedPassword, email]);
            console.log('✅ Updated PAB Account: pab@test.com / org123');
        }

        await client.query('COMMIT');
        console.log('--- ALL SYSTEMS SYNCHRONIZED ---');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Sync failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

definitiveFix();
