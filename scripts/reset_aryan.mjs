import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function reset() {
  const chennaiHosp = await pool.query("SELECT hospital_id FROM hospitals WHERE city ILIKE '%Chennai%' LIMIT 1");
  const chennaiId = chennaiHosp.rows[0].hospital_id;
  
  await pool.query("UPDATE donors SET hospital_id = $1, medical_history = 'Healthy' WHERE organlink_id = 'OL-D-768-99'", [chennaiId]);
  console.log('Aryan successfully reset to Chennai registry.');
}

reset().catch(console.error).finally(() => pool.end());
