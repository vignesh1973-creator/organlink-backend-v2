const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });
async function fix() {
  await pool.query("UPDATE donors SET hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Chennai%' LIMIT 1) WHERE organlink_id = 'OL-D-768-99'");
  await pool.query("DELETE FROM donors WHERE hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Mumbai%' LIMIT 1) AND full_name LIKE '%Jyoti%'");
  // Also delete Demo user if it exists to clean up
  await pool.query("DELETE FROM donors WHERE hospital_id = (SELECT hospital_id FROM hospitals WHERE city ILIKE '%Mumbai%' LIMIT 1) AND full_name LIKE '%Demo%'");
  console.log('Reset complete!');
}
fix().catch(console.error).finally(()=>pool.end());
