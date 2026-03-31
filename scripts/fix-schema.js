
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const { Pool } = pg;

async function fixSchema() {
    console.log('🔧 Starting Schema Repair...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing in .env');
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    try {
        // 1. Fix 'hospitals' table: contact_phone -> phone
        console.log("Checking 'hospitals' table columns...");

        // Check if 'contact_phone' exists
        const checkRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='hospitals' AND column_name='contact_phone'
    `);

        if (checkRes.rowCount > 0) {
            console.log("Found mismatch: 'contact_phone'. Renaming to 'phone'...");
            await pool.query(`ALTER TABLE hospitals RENAME COLUMN contact_phone TO phone;`);
            console.log("✅ Renamed 'contact_phone' to 'phone'.");
        } else {
            // Check if 'phone' exists to be sure
            const checkPhone = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='hospitals' AND column_name='phone'
        `);
            if (checkPhone.rowCount > 0) {
                console.log("✅ 'hospitals' table already has 'phone' column.");
            } else {
                console.log("⚠️ neither 'contact_phone' nor 'phone' found? Attempting to add 'phone'...");
                await pool.query(`ALTER TABLE hospitals ADD COLUMN phone VARCHAR(50);`);
                console.log("✅ Added 'phone' column.");
            }
        }

        console.log("\n🎉 Schema repair complete! Try creating the hospital again.");

    } catch (err) {
        console.error('❌ Repair Failed:', err.message);
    } finally {
        await pool.end();
    }
}

fixSchema();
