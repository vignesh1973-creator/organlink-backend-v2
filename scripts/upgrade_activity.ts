import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function upgrade() {
    try {
        console.log('Adding last_check_in columns...');
        await pool.query('ALTER TABLE donors ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP DEFAULT NOW()');
        await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP DEFAULT NOW()');
        
        console.log('Updating hospital locations...');
        await pool.query("UPDATE hospitals SET city = 'Chennai', state = 'Tamil Nadu' WHERE hospital_id = 'HOSP76883068'");
        await pool.query("UPDATE hospitals SET city = 'Mumbai', state = 'Maharashtra' WHERE hospital_id = 'HOSP09908226'");
        
        console.log('Randomizing last_check_in for demo... (some fresh, some old)');
        // Chennai donors
        const chennai = await pool.query("SELECT donor_id FROM donors WHERE hospital_id = 'HOSP76883068'");
        for (let i = 0; i < chennai.rows.length; i++) {
            const daysOffset = Math.floor(Math.random() * 45); // 0 to 45 days ago
            await pool.query("UPDATE donors SET last_check_in = NOW() - INTERVAL '" + daysOffset + " days' WHERE donor_id = $1", [chennai.rows[i].donor_id]);
        }
        
        console.log('✅ Database Schema & Data Updated for 30-Day Simulation.');
    } catch (e) {
        console.error('Upgrade failed:', e);
    } finally {
        await pool.end();
    }
}

upgrade();
