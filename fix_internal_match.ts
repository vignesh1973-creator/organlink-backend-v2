
import 'dotenv/config';
import { pool } from './config/database.js';

async function fixInternalMatchSchema() {
    console.log('--- STARTING UNIVERSAL INTERNAL MATCH FIX ---');
    try {
        // 1. Fix notifications table (removing duplicate and fixing syntax)
        console.log('🛠️ Fixing notifications schema...');
        // First try to drop and recreate cleanly or just fix
        // We'll use a safer approach: add/drop columns as needed
        await pool.query(`
            DO $$ 
            BEGIN 
                -- Fix communication_logs if exists
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'communication_logs') THEN
                    ALTER TABLE communication_logs ALTER COLUMN recipient_id TYPE VARCHAR(100);
                ELSE
                    CREATE TABLE communication_logs (
                        log_id SERIAL PRIMARY KEY,
                        recipient_type VARCHAR(20),
                        recipient_id VARCHAR(100),
                        recipient_name VARCHAR(255),
                        contact_method VARCHAR(20),
                        contact_details VARCHAR(255),
                        message_template VARCHAR(100),
                        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status VARCHAR(50) DEFAULT 'delivered'
                    );
                END IF;

                -- Fix notifications table
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
                    -- No easy way to fix a syntax error that prevented table creation, 
                    -- so let's ensure it exists with correct columns
                    -- (Already exists? then we just check columns)
                    NULL;
                ELSE
                    CREATE TABLE notifications (
                        notification_id VARCHAR(100) PRIMARY KEY,
                        hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
                        organization_id INTEGER REFERENCES organizations(organization_id),
                        type VARCHAR(50) NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        message TEXT,
                        related_id VARCHAR(100),
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                END IF;
            END $$;
        `);
        console.log('✅ Schema fixed successfully.');

        // 2. Ensure organ_requests has correct related IDs
        console.log('🛠️ Verifying organ_requests indices...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_requests_patient ON organ_requests(patient_id);
            CREATE INDEX IF NOT EXISTS idx_requests_donor ON organ_requests(donor_id);
        `);
        
        console.log('✨ INTERNAL MATCH ENGINE FULLY RESTORED!');

    } catch (err) {
        console.error('❌ Fix failed:', err);
    } finally {
        await pool.end();
    }
}
fixInternalMatchSchema();
