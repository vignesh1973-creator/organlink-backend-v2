const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function check() {
  const result = await pool.query("SELECT title, policy_content FROM policies");
  console.log('--- POLICY CONTENT DATA ---');
  result.rows.forEach(row => {
    console.log(`Title: ${row.title}`);
    console.log(`Content Type: ${typeof row.policy_content}`);
    console.log(`Content: ${row.policy_content}`);
    console.log('---');
  });
}

check().catch(console.error).finally(() => pool.end());
