
import { pool } from '../config/database.js';

async function debugSchema() {
    const client = await pool.connect();
    try {
        console.log('🔍 Deep Schema Debug...');

        // Check Connection Info (Masked)
        const host = client.host;
        const db = client.database;
        console.log(`📡 Connected to: ${host} / ${db}`);

        // List ALL tables named 'patients' in ALL schemas
        const diffTables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'patients'
    `);
        console.log('\n📂 Found "patients" tables:', diffTables.rows);

        // Force Add Columns to 'public.patients'
        console.log('\n🔨 Forcing Schema Update on public.patients...');
        try {
            await client.query(`ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS govt_id_type VARCHAR(50)`);
            console.log(' - Added govt_id_type (or existed)');
        } catch (e) { console.error(' - Failed govt_id_type:', e.message); }

        try {
            await client.query(`ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS govt_id_number VARCHAR(100)`);
            console.log(' - Added govt_id_number (or existed)');
        } catch (e) { console.error(' - Failed govt_id_number:', e.message); }

        try {
            await client.query(`ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS organlink_id VARCHAR(50)`);
            console.log(' - Added organlink_id (or existed)');
        } catch (e) { console.error(' - Failed organlink_id:', e.message); }


        // Verify again
        const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'patients' AND table_schema = 'public'
    `);
        console.log('\n📋 Final Columns in public.patients:');
        cols.rows.forEach(r => console.log(` - ${r.column_name}`));

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

debugSchema();
