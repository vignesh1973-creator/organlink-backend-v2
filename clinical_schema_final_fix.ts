
import 'dotenv/config';
import { pool } from './config/database.js';

async function clinicalSchemaFinalFix() {
    console.log('--- STARTING CLINICAL SCHEMA FINAL FIX ---');
    try {
        console.log('🛠️ Adding match tracking columns to patients table...');
        await pool.query(`
            ALTER TABLE patients 
            ADD COLUMN IF NOT EXISTS matched_donor_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS matched_hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
            ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        console.log('🛠️ Adding match tracking columns to donors table...');
        await pool.query(`
            ALTER TABLE donors 
            ADD COLUMN IF NOT EXISTS matched_patient_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Available';
        `);

        console.log('🛠️ Ensuring organ_requests has all necessary fields...');
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organ_requests') THEN
                    CREATE TABLE organ_requests (
                        request_id VARCHAR(100) PRIMARY KEY,
                        from_hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
                        to_hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
                        patient_id VARCHAR(100),
                        donor_id VARCHAR(100),
                        status VARCHAR(50) DEFAULT 'pending',
                        notes TEXT,
                        response_notes TEXT,
                        is_viewed_by_donor_hospital BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                END IF;
            END $$;
        `);

        console.log('🛠️ Rebuilding notifications table cleanly...');
        await pool.query(`
            DROP TABLE IF EXISTS notifications CASCADE;
            CREATE TABLE notifications (
                notification_id VARCHAR(100) PRIMARY KEY,
                hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
                organization_id INTEGER REFERENCES organizations(organization_id),
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                related_id VARCHAR(100),
                is_read BOOLEAN DEFAULT FALSE,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ ALL CLINICAL SCHEMAS FINALIZED!');
    } catch (err) {
        console.error('❌ Final fix failed:', err);
    } finally {
        await pool.end();
    }
}
clinicalSchemaFinalFix();
