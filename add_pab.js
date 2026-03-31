
import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

async function addPAB() {
    const client = await pool.connect();
    try {
        console.log('Adding Patient Advocacy Board...');
        const hashedPassword = '$2a$10$F8vAMr.bDvs7DwmJxxN26uGV1dNXV1vF/CaGzAqhyyoXGGavJx/8Ra'; // org123

        // Check if exists
        const check = await client.query('SELECT * FROM organizations WHERE LOWER(email) = LOWER($1)', ['PAB']);
        if (check.rows.length === 0) {
            await client.query(`
                INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
                VALUES ($1, $2, $3, $4, true, NOW())
            `, ['Patient Advocacy Board', 'PAB', hashedPassword, 'Representing the patient community in the consortium.']);
            console.log('✅ Patient Advocacy Board (PAB) has been successfully created.');
        } else {
            console.log('ℹ️ PAB already exists.');
        }

    } catch (err) {
        console.error('Failed to add PAB:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

addPAB();
