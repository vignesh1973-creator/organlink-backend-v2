import { pool } from '../config/database';

async function test() {
  const hRes = await pool.query("SELECT hospital_id, name FROM hospitals");
  console.log("Hospitals:", hRes.rows);
  
  const hospital_id = hRes.rows.find(h => h.name.includes("Apollo"))?.hospital_id;
  console.log("Testing for hospital_id:", hospital_id);

  const patientStats = await pool.query(
    `SELECT 
      COUNT(*) as total_patients,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_patients,
      COUNT(CASE WHEN signature_verified = true THEN 1 END) as verified_patients,
      COUNT(CASE WHEN urgency_level = 'High' THEN 1 END) as urgent_patients
     FROM patients 
     WHERE hospital_id = $1`,
    [hospital_id],
  );

  console.log("Patient Stats:", patientStats.rows[0]);
  process.exit(0);
}

test();
