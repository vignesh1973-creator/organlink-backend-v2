import { pool } from '../config/database';
import fs from 'fs';

async function test() {
  const res = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'matching_requests'`
  );
  
  const org = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organ_requests'`
  );

  fs.writeFileSync('out3.txt', JSON.stringify({
    matching_requests: res.rows,
    organ_requests: org.rows
  }, null, 2));

  process.exit(0);
}

test();
