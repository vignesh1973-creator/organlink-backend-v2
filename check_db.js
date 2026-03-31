const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function check() {
  const res = await pool.query("SELECT title, organ_type, status FROM policies");
  console.log('--- DB POLICIES ---');
  res.rows.forEach(r => console.log(`[${r.status}] ${r.title} (${r.organ_type})`));
}

check().catch(console.error).finally(()=>pool.end());
