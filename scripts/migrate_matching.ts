
import 'dotenv/config';
import { pool } from '../config/database.js';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting matching_requests migration...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS matching_requests (
        request_id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(patient_id),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        match_score INTEGER,
        matched_donor_id INTEGER REFERENCES donors(donor_id)
      );
    `);
        console.log('✅ matching_requests table created.');

        // Also ensure communication_logs exists as it was mentioned in plan
        await client.query(`
      CREATE TABLE IF NOT EXISTS communication_logs (
        log_id SERIAL PRIMARY KEY,
        recipient_type VARCHAR(20), -- 'donor' or 'patient'
        recipient_id INTEGER,
        message TEXT,
        status VARCHAR(50),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ communication_logs table created.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
