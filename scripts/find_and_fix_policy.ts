
import { pool } from "../config/database";

async function findPolicy() {
    try {
        console.log("Searching for policy by title...");
        const res = await pool.query(`
            SELECT * FROM policies WHERE title LIKE '%Kidney Transport Priority Policy 2025%'
        `);
        console.log("Found:", res.rows);

        if (res.rows.length > 0) {
            const pid = res.rows[0].policy_id;
            console.log(`Checking votes for Policy ID ${pid}...`);
            const votes = await pool.query(`SELECT * FROM policy_votes WHERE policy_id = $1`, [pid]);
            console.log("Votes:", votes.rows.length);
            console.log("Yes Votes:", votes.rows.filter((v: any) => v.vote === true).length);

            // Fix it
            if (votes.rows.filter((v: any) => v.vote === true).length >= 3) {
                console.log(`Activating Policy #${pid}...`);
                await pool.query("UPDATE policies SET status = 'Active', yes_votes = $1 WHERE policy_id = $2",
                    [votes.rows.filter((v: any) => v.vote === true).length, pid]);
            }
        } else {
            console.log("Checking ALL policies...");
            const all = await pool.query("SELECT policy_id, title FROM policies");
            console.table(all.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

findPolicy();
