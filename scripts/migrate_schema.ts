
import { pool } from '../config/database.js';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting schema migration...');

        // Add columns to donors table
        console.log('Migrating donors table...');
        await client.query(`
      ALTER TABLE donors 
      ADD COLUMN IF NOT EXISTS govt_id_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS govt_id_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS organlink_id VARCHAR(50);
    `);
        console.log('Donors table updated.');

        // Add columns to patients table
        console.log('Migrating patients table...');
        await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS govt_id_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS govt_id_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS organlink_id VARCHAR(50);
    `);
        console.log('Patients table updated.');

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
