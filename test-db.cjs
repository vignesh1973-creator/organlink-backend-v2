const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function run() {
  try {
    const res = await pool.query(`
      SELECT a.attname, format_type(a.atttypid, a.atttypmod), i.indisunique
      FROM   pg_index i
      JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE  i.indrelid = 'donors'::regclass AND i.indisunique;
    `);
    console.log("Unique indexes on donors table:");
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
