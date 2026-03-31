
import { pool } from "../config/database";

async function forceCreatePolicyOne() {
    try {
        console.log("Forcing creation of Policy #1...");

        // Use a dynamic query to get valid organization_id
        const orgRes = await pool.query("SELECT organization_id FROM organizations LIMIT 1");
        if (orgRes.rows.length === 0) {
            throw new Error("No organizations found!");
        }
        const orgId = orgRes.rows[0].organization_id;
        console.log("Using Org ID:", orgId);

        // Delete existing 1 if any
        await pool.query("DELETE FROM policies WHERE policy_id = 1");

        // Insert with Active status
        await pool.query(`
            INSERT INTO policies (policy_id, proposer_org_id, title, description, status, created_at, policy_content)
            VALUES (1, $1, 'Kidney Transport Priority Policy 2025', 'This policy ensures that during kidney donor-recipient matching, donors located geographically closer to the requesting hospital are given higher priority. The policy aims to reduce organ transport time.', 'Active', NOW(), '{}')
        `, [orgId]);
        console.log("Policy #1 created as Active.");

        // Ensure votes exist for display
        await pool.query("DELETE FROM policy_votes WHERE policy_id = 1"); // Clear mock votes
        await pool.query("INSERT INTO policy_votes (policy_id, organization_id, vote, voted_at) VALUES (1, $1, true, NOW())", [orgId]);

        // Get other orgs if possible for variety
        const otherOrgs = await pool.query("SELECT organization_id FROM organizations WHERE organization_id != $1 LIMIT 3", [orgId]);
        for (const o of otherOrgs.rows) {
            await pool.query("INSERT INTO policy_votes (policy_id, organization_id, vote, voted_at) VALUES (1, $1, true, NOW())", [o.organization_id]);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

forceCreatePolicyOne();
