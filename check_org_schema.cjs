const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function checkOrgs() {
  const schema = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'organizations'");
  console.log('--- COLUMNS ---');
  schema.rows.forEach(r => console.log(r.column_name));

  const result = await pool.query("SELECT * FROM organizations");
  console.log('\n--- ORGANIZATIONS DATA ---');
  console.log(JSON.stringify(result.rows, null, 2));
}

checkOrgs().catch(console.error).finally(() => pool.end());
