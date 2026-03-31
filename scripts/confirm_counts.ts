import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function fix() {
    const CHENNAI_ID = 'HOSP76883068';
    const MUMBAI_ID = 'HOSP09908226';
    
    // Fix Chennai Donors
    const dRes = await pool.query("SELECT donor_id FROM donors WHERE hospital_id = $1 AND status != 'Transferred'", [CHENNAI_ID]);
    if (dRes.rowCount > 100) {
        console.log(`Clipping ${dRes.rowCount - 100} excess donors from Chennai...`);
        const toDeleteIds = dRes.rows.slice(0, dRes.rowCount - 100).map(r => r.donor_id);
        await pool.query("DELETE FROM donors WHERE donor_id = ANY($1)", [toDeleteIds]);
    } else if (dRes.rowCount < 100) {
        // ... (This shouldn't happen after my seeding, but good to check)
    }

    // Fix Chennai Patients
    const pRes = await pool.query("SELECT patient_id FROM patients WHERE hospital_id = $1 AND status != 'Transferred'", [CHENNAI_ID]);
    if (pRes.rowCount > 100) {
        const toDeleteIds = pRes.rows.slice(0, pRes.rowCount - 100).map(r => r.patient_id);
        await pool.query("DELETE FROM patients WHERE patient_id = ANY($1)", [toDeleteIds]);
    }

    // Mumbai
    const mD = await pool.query("SELECT donor_id FROM donors WHERE hospital_id = $1 AND status != 'Transferred'", [MUMBAI_ID]);
    if (mD.rowCount > 50) {
        const toDeleteIds = mD.rows.slice(0, mD.rowCount - 50).map(r => r.donor_id);
        await pool.query("DELETE FROM donors WHERE donor_id = ANY($1)", [toDeleteIds]);
    }
    const mP = await pool.query("SELECT patient_id FROM patients WHERE hospital_id = $1 AND status != 'Transferred'", [MUMBAI_ID]);
    if (mP.rowCount > 50) {
        const toDeleteIds = mP.rows.slice(0, mP.rowCount - 50).map(r => r.patient_id);
        await pool.query("DELETE FROM patients WHERE patient_id = ANY($1)", [toDeleteIds]);
    }

    console.log("Counts strictly enforced to 100/50.");
    process.exit(0);
}
fix();
