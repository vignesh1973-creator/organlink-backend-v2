
import 'dotenv/config';
import { pool } from './config/database.js';

async function restoreHospitalMatchingTables() {
    console.log('--- RESTORING HOSPITAL MATCHING ENGINE TABLES ---');
    try {
        console.log('🛠️ Creating organ_requests table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS organ_requests (
                request_id VARCHAR(100) PRIMARY KEY,
                from_hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
                to_hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
                patient_id VARCHAR(100), -- Should link to patients.patient_id
                donor_id VARCHAR(100), -- Should link to donors.donor_id
                status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled'
                notes TEXT,
                response_notes TEXT,
                is_viewed_by_donor_hospital BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('🛠️ Cleaning and fixing notifications table...');
        // Drop it if broken and recreate
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

        console.log('🛠️ Ensuring communication_logs exists with correct types...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS communication_logs (
                log_id SERIAL PRIMARY KEY,
                recipient_type VARCHAR(20),
                recipient_id VARCHAR(100),
                recipient_name VARCHAR(255),
                contact_method VARCHAR(20),
                contact_details VARCHAR(255),
                message_template VARCHAR(255),
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'delivered'
            );
            ALTER TABLE communication_logs ALTER COLUMN recipient_id TYPE VARCHAR(100);
        `);

        console.log('✅ TABLE RESTORATION COMPLETE!');
    } catch (err) {
        console.error('❌ Restoration failed:', err);
    } finally {
        await pool.end();
    }
}
restoreHospitalMatchingTables();
