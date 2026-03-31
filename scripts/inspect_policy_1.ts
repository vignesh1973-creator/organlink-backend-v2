
import { pool } from "../config/database";

async function inspectPolicyOne() {
    try {
        const res = await pool.query(`
            SELECT * FROM policies WHERE policy_id = 1
        `);
        console.log("Policy #1 Data:", res.rows[0]);

        const votes = await pool.query(`
            SELECT * FROM policy_votes WHERE policy_id = 1
        `);
        console.log("Policy #1 Votes:", votes.rows);

        // Fix if needed
        if (res.rows[0].yes_votes < 3 && votes.rows.filter((v: any) => v.vote === true).length >= 3) {
            console.log("Syncing vote count...");
            const yesVotes = votes.rows.filter((v: any) => v.vote === true).length;
            await pool.query('UPDATE policies SET yes_votes = $1 WHERE policy_id = 1', [yesVotes]);

            if (yesVotes >= 3) {
                console.log("Activating Policy #1...");
                await pool.query("UPDATE policies SET status = 'Active' WHERE policy_id = 1");
            }
        } else if (res.rows[0].status !== 'Active' && votes.rows.filter((v: any) => v.vote === true).length >= 3) {
            console.log("Vote count OK but status wrong. Activating Policy #1...");
            await pool.query("UPDATE policies SET status = 'Active' WHERE policy_id = 1");
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

inspectPolicyOne();
