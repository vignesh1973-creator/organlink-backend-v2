import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const ogid = 'OL-D-768-2';
    const res = await pool.query('SELECT donor_id, full_name, hospital_id, organlink_id, blood_type FROM donors WHERE organlink_id = $1', [ogid]);
    console.log(`Donors with OGID ${ogid}:`);
    console.log(JSON.stringify(res.rows, null, 2));

    const dups = await pool.query(`
        SELECT organlink_id, COUNT(*) 
        FROM donors 
        WHERE organlink_id IS NOT NULL AND organlink_id != ''
        GROUP BY organlink_id 
        HAVING COUNT(*) > 1
    `);
    console.log('Other duplicate OGIDs in donors:');
    console.log(JSON.stringify(dups.rows, null, 2));

    // Check schema
    const schema = await pool.query(`
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid = 'donors'::regclass AND contype = 'u'
    `);
    console.log('Unique constraints on donors:');
    console.log(JSON.stringify(schema.rows, null, 2));

    process.exit(0);
}

run().catch(console.error);
