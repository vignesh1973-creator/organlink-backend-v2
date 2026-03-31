import { pool } from "../config/database.js";

async function listTables() {
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log("Tables in DB:", res.rows.map(r => r.table_name));

        // Also check active constraints on policy_votes
        const constraints = await pool.query(`
      SELECT con.conname, rel.relname as table_name, pg_get_constraintdef(con.oid)
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = connamespace
      WHERE nsp.nspname = 'public'
      AND rel.relname = 'policy_votes';
    `);
        console.log("Constraints on policy_votes:", constraints.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

listTables();
