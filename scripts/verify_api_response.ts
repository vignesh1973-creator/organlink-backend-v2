
import { pool } from "../config/database";

async function verifyApiResponse() {
    try {
        console.log("Verifying API-like query...");
        // This query matches GET / found in organization-policies.ts
        const result = await pool.query(`
          SELECT 
            p.policy_id as id,
            p.title,
            p.status,
            p.created_at,
            (SELECT COUNT(*) FROM policy_votes v WHERE v.policy_id = p.policy_id AND v.vote = true) as yes_votes
          FROM policies p
          ORDER BY p.created_at DESC
        `);

        console.log("Found Policies:", result.rows.length);
        console.table(result.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

verifyApiResponse();
