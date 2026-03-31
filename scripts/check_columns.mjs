import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function check() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'donors'");
  console.log(res.rows.map(r => r.column_name).join(', '));
}

check().catch(console.error).finally(() => pool.end());
