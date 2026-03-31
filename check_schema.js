const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:4632@localhost:5432/organlink_local"
});

async function checkSchema() {
  try {
    await client.connect();
    const tables = ['hospitals', 'patients', 'donors'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      console.log(`Schema for ${table}:`);
      console.log(JSON.stringify(res.rows, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkSchema();
