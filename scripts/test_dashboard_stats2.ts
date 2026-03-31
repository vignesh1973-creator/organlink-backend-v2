import { pool } from '../config/database';

async function test() {
  const patientStats = await pool.query(
    `SELECT hospital_id, COUNT(*) as count FROM patients GROUP BY hospital_id`
  );

  console.log("Patient counts per hospital_id:", patientStats.rows);
  
  const hRes = await pool.query("SELECT hospital_id, name, email FROM hospitals");
  console.log("All hospitals:", hRes.rows);

  process.exit(0);
}

test();
