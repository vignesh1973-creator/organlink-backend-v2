import { pool } from '../config/database';
import fs from 'fs';

async function test() {
  const patientStats = await pool.query(
    `SELECT hospital_id, COUNT(*) as count FROM patients GROUP BY hospital_id`
  );
  
  const hRes = await pool.query("SELECT hospital_id, name, email FROM hospitals");

  fs.writeFileSync('out2.txt', JSON.stringify({
    patients: patientStats.rows,
    hospitals: hRes.rows
  }, null, 2));

  process.exit(0);
}

test();
