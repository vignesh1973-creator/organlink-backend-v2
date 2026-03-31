import { pool } from '../config/database';
import fs from 'fs';

async function test() {
  const hospitals = await pool.query(`SELECT hospital_id, name, city FROM hospitals`);
  const pCounts = await pool.query(`SELECT hospital_id, COUNT(*) as count FROM patients GROUP BY hospital_id`);
  const dCounts = await pool.query(`SELECT hospital_id, COUNT(*) as count FROM donors GROUP BY hospital_id`);

  fs.writeFileSync('fill_counts.json', JSON.stringify({
    hospitals: hospitals.rows,
    patients: pCounts.rows,
    donors: dCounts.rows
  }, null, 2));

  process.exit(0);
}

test();
