
import { pool } from '../config/database';

async function checkTables() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", res.rows.map(r => r.table_name));

        const policies = await pool.query("SELECT * FROM policies");
        console.log("Policies Rows:", policies.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
checkTables();
