import { pool } from '../config/database';

async function test() {
  const allPatients = await pool.query(
    `SELECT patient_id, hospital_id, full_name, created_at FROM patients`
  );

  console.log("All patients count:", allPatients.rows.length);
  console.log("First 5 patients:", allPatients.rows.slice(0, 5));
  
  process.exit(0);
}

test();
