import { pool } from '../config/database';

async function test() {
  const res = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'matching_requests'`
  );
  console.log("columns:", res.rows);
  
  const org = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organ_requests'`
  );
  console.log("organ_requests columns:", org.rows);

  process.exit(0);
}

test();
