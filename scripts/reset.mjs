import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function fix() {
  await pool.query(`UPDATE donors SET hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Chennai%' LIMIT 1) WHERE organlink_id = 'OL-D-768-99'`);
  await pool.query(`DELETE FROM donors WHERE hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Mumbai%' LIMIT 1) AND full_name LIKE '%Jyoti%'`);
  await pool.query(`DELETE FROM donors WHERE hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Mumbai%' LIMIT 1) AND full_name LIKE '%Demo%'`);
  await pool.query(`DELETE FROM donors WHERE hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Mumbai%' LIMIT 1) AND donor_id > 450`); // Delete Myra Jain or anyone generated above 50!
  
  const m = await pool.query(`SELECT COUNT(*) FROM donors WHERE hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Mumbai%' LIMIT 1)`);
  const c = await pool.query(`SELECT COUNT(*) FROM donors WHERE hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Chennai%' LIMIT 1)`);
  console.log(`Mumbai count: ${m.rows[0].count}`);
  console.log(`Chennai count: ${c.rows[0].count}`);
}

fix().catch(console.error).finally(()=>pool.end());
