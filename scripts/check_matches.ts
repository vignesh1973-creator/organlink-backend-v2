import { pool } from '../config/database';

async function test() {
  const matches = await pool.query(`SELECT COUNT(*) as count FROM matching_requests`);
  console.log("Total matching requests in DB:", matches.rows[0].count);
  process.exit(0);
}

test();
