import 'dotenv/config';
import { pool } from './config/database.js';

async function checkCounts() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT hospital_id, COUNT(*) as count 
      FROM patients 
      WHERE hospital_id IN ('HOSP63218243', 'HOSP63271667') 
      GROUP BY hospital_id
    `);
    console.log('Patients counts:', res.rows);

    const res2 = await client.query(`
      SELECT hospital_id, COUNT(*) as count 
      FROM donors 
      WHERE hospital_id IN ('HOSP63218243', 'HOSP63271667') 
      GROUP BY hospital_id
    `);
    console.log('Donors counts:', res2.rows);

    const res3 = await client.query(`
      SELECT COUNT(*) as count FROM policies
    `);
    console.log('Total policies:', res3.rows[0].count);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkCounts();
