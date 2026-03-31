const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function checkOrgs() {
  const result = await pool.query("SELECT id, name FROM organizations ORDER BY id");
  console.log('--- ORGANIZATIONS ---');
  result.rows.forEach(row => {
    console.log(`ID: ${row.id}, Name: ${row.name}`);
  });
  
  const policies = await pool.query("SELECT proposer_org_id, COUNT(*) FROM policies GROUP BY proposer_org_id");
  console.log('\n--- POLICY COUNTS PER ORG ID ---');
  policies.rows.forEach(row => {
    console.log(`Org ID: ${row.proposer_org_id}, Count: ${row.count}`);
  });
}

checkOrgs().catch(console.error).finally(() => pool.end());
