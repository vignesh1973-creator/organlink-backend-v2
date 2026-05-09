const { Pool } = require('pg');
require('dotenv').config();

const p = new Pool({
  connectionString: process.env.DATABASE_URL
});

p.query('INSERT INTO notifications (notification_id, hospital_id, type, title, message, related_id, is_read) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
  ['TEST_1', 'HOSP09908226', 'test', 'Test', 'Test', '1', false])
.then(r => {
  console.log("SUCCESS");
  p.end();
})
.catch(e => {
  console.error("ERROR:", e.message);
  p.end();
});
