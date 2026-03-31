import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    // 1. Check Chennai counts
    const chennaiId = 'HOSP76883068';
    const mumbaiId = 'HOSP09908226';
    
    const pC = await pool.query('SELECT COUNT(*) FROM patients WHERE hospital_id = $1', [chennaiId]);
    const dC = await pool.query('SELECT COUNT(*) FROM donors WHERE hospital_id = $1', [chennaiId]);
    
    console.log(`Chennai - Patients: ${pC.rows[0].count}, Donors: ${dC.rows[0].count}`);

    const pM = await pool.query('SELECT COUNT(*) FROM patients WHERE hospital_id = $1', [mumbaiId]);
    const dM = await pool.query('SELECT COUNT(*) FROM donors WHERE hospital_id = $1', [mumbaiId]);
    
    console.log(`Mumbai - Patients: ${pM.rows[0].count}, Donors: ${dM.rows[0].count}`);

    // 2. Check missing OGIDs
    const missingDonors = await pool.query('SELECT donor_id, full_name, hospital_id FROM donors WHERE organlink_id IS NULL OR organlink_id = \'\'');
    console.log(`Missing OGID Donors: ${missingDonors.rowCount}`);

    const missingPatients = await pool.query('SELECT patient_id, full_name, hospital_id FROM patients WHERE organlink_id IS NULL OR organlink_id = \'\'');
    console.log(`Missing OGID Patients: ${missingPatients.rowCount}`);

    process.exit(0);
}

run().catch(console.error);
