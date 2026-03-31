
import 'dotenv/config';
import { pool } from './config/database.js';

async function clinicalRecordDeduplication() {
    console.log('--- STARTING CLINICAL RECORD DEDUPLICATION ---');
    try {
        // Keep only the most recent request for each patient/donor pair
        console.log('🛠️ Scrubbing duplicate match records from the coordination ledger...');
        await pool.query(`
            DELETE FROM organ_requests a 
            USING organ_requests b 
            WHERE a.created_at < b.created_at 
            AND a.patient_id = b.patient_id 
            AND a.donor_id = b.donor_id;
        `);
        
        console.log('✅ Coordination ledger successfully scrubbed and unique!');
    } catch (err) {
        console.error('❌ Deduplication failed:', err);
    } finally {
        await pool.end();
    }
}
clinicalRecordDeduplication();
