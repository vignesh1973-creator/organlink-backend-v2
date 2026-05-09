
import express from "express";
import { authenticateOrganization, AuthRequest } from "../middleware/auth.js";
import { orgPolicyVotingService } from "../services/orgPolicyVoting.js";
import { pool } from "../config/database.js";

const router = express.Router();

// All routes require organization auth
router.use(authenticateOrganization);

function requireOrganization(
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction,
) {
  if (!req.user || req.user.type !== "organization") {
    return res
      .status(403)
      .json({ success: false, error: "Organization access required" });
  }
  next();
}

router.use(requireOrganization);

// GET /notifications - Unread notifications for navbar
router.get("/notifications", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.organization_id;

    // Fetch notifications (Standalone)
    const notificationsResult = await pool.query(`
      SELECT p.policy_id as id, p.title, org.name as proposer_name, p.created_at
      FROM policies p
      JOIN organizations org ON p.proposer_org_id = org.organization_id
      WHERE p.status = 'Proposed' 
      AND p.proposer_org_id != $1
      AND NOT EXISTS (
        SELECT 1 FROM policy_votes v 
        WHERE v.policy_id = p.policy_id AND v.organization_id = $1
      )
      ORDER BY p.created_at DESC
      LIMIT 10
    `, [orgId]);

    // Format notifications
    const notifications = notificationsResult.rows.map(row => ({
      id: row.id,
      title: "New Policy Proposal",
      message: `${row.proposer_name} proposed: "${row.title}"`,
      time: row.created_at,
      is_read: false,
      link: `/organization/policies/vote/${row.id}`
    }));

    res.json({ success: true, notifications });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});


// GET /dashboard-stats - Stats for the dashboard
router.get("/dashboard-stats", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.organization_id;

    // 1. Active Policies (Global active count)
    console.log("--- DASHBOARD DEBUG ---");
    console.log("DB HOST:", process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    const activeResult = await pool.query("SELECT COUNT(*) FROM policies WHERE status = 'Active'");
    console.log("ACTIVE POLICY COUNT IN DB:", activeResult.rows[0].count);
    const activePolicies = parseInt(activeResult.rows[0].count);

    // 2. My Proposals
    const myResult = await pool.query("SELECT COUNT(*) FROM policies WHERE proposer_org_id = $1", [orgId]);
    const myProposals = parseInt(myResult.rows[0].count);

    // 3. Pending Votes (Policies Proposed by OTHERS that I haven't voted on)
    const pendingResult = await pool.query(`
      SELECT COUNT(*) FROM policies p
      WHERE p.status = 'Proposed' 
      AND p.proposer_org_id != $1
      AND NOT EXISTS (
        SELECT 1 FROM policy_votes v 
        WHERE v.policy_id = p.policy_id AND v.organization_id = $1
      )
    `, [orgId]);
    const pendingVotes = parseInt(pendingResult.rows[0].count);

    // 4. Total Votes Cast by Me
    const votesResult = await pool.query("SELECT COUNT(*) FROM policy_votes WHERE organization_id = $1", [orgId]);
    const totalVotes = parseInt(votesResult.rows[0].count);

    // 5. Notifications: List of policies waiting for my vote
    const notificationsResult = await pool.query(`
      SELECT p.policy_id as id, p.title, org.name as proposer_name, p.created_at
      FROM policies p
      JOIN organizations org ON p.proposer_org_id = org.organization_id
      WHERE p.status = 'Proposed' 
      AND p.proposer_org_id != $1
      AND NOT EXISTS (
        SELECT 1 FROM policy_votes v 
        WHERE v.policy_id = p.policy_id AND v.organization_id = $1
      )
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [orgId]);

    // Format notifications
    const notifications = notificationsResult.rows.map(row => ({
      id: row.id,
      title: "New Policy Proposal",
      message: `${row.proposer_name} proposed: "${row.title}"`,
      time: row.created_at, // Client side can format "2 hours ago"
      read: false,
      link: `/organization/policies/vote/${row.id}`
    }));

    res.json({
      success: true,
      stats: {
        activePolicies,
        myProposals,
        pendingVotes,
        totalVotes
      },
      notifications // Send this back
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// GET /policies - Fetch all policies with vote counts
router.get("/", async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.policy_id as id,
        p.title,
        p.description,
        p.policy_content as metrics, 
        p.status,
        p.created_at,
        p.policy_type,
        p.replaces_id,
        p.proposer_org_id as proposer_id,
        org.name as proposer_name,
        (SELECT COUNT(*) FROM policy_votes v WHERE v.policy_id = p.policy_id AND v.vote = true) as yes_votes,
        (SELECT COUNT(*) FROM policy_votes v WHERE v.policy_id = p.policy_id AND v.vote = false) as no_votes,
        (SELECT vote FROM policy_votes v WHERE v.policy_id = p.policy_id AND v.organization_id = $1 LIMIT 1) as my_vote,
        (SELECT json_agg(json_build_object('organization_id', v.organization_id, 'vote', v.vote)) FROM policy_votes v WHERE v.policy_id = p.policy_id) as voters
      FROM policies p
      JOIN organizations org ON p.proposer_org_id = org.organization_id
      ORDER BY p.created_at DESC
    `, [req.user!.organization_id]);

    // Parse metrics if they are stored as JSON string in policy_content
    const policies = result.rows.map(row => {
      let parsedMetrics = {};
      try {
        parsedMetrics = typeof row.metrics === 'string' ? JSON.parse(row.metrics) : (row.metrics || {});
      } catch (e) { parsedMetrics = {} }
      
      // Ensure voters is ALWAYS an array even if it's null from database
      const voters = row.voters || [];
      
      return { ...row, metrics: parsedMetrics, voters };
    });

    res.json({ success: true, policies, _debug_db: process.env.DATABASE_URL });
  } catch (error: any) {
    console.error("Error fetching policies:", error);
    res.status(500).json({ success: false, error: "Failed to fetch policies" });
  }
});

// POST /propose - Create a new policy proposal
router.post("/propose", async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { title, description, voting_period_days = 7, organ_type, policy_type, replaces_id, metrics } = req.body;
    const orgId = req.user!.organization_id;

    if (!title || !description) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, error: "Title and description required" });
    }

    // 1. Insert into 'policies' table
    const result = await client.query(
      `INSERT INTO policies 
       (title, description, status, proposer_org_id, voting_deadline, created_at, updated_at, organ_type, policy_type, replaces_id, policy_content) 
       VALUES ($1, $2, 'Proposed', $3, NOW() + interval '${voting_period_days} days', NOW(), NOW(), $4, $5, $6, $7) 
       RETURNING policy_id`,
      [title, description, orgId, organ_type, policy_type, replaces_id, JSON.stringify(metrics || {})]
    );

    const policyId = result.rows[0].policy_id;
    const db_organ_type = result.rows[0].organ_type;

    // 2. Auto-insert Proposer's YES vote into policy_votes
    await client.query(
      `INSERT INTO policy_votes (policy_id, organization_id, vote, created_at) 
       VALUES ($1, $2, true, NOW())`,
      [policyId, orgId]
    );

    // 3. Call Blockchain Service
    const txResult = await orgPolicyVotingService.proposePolicy(policyId, title, description, voting_period_days);

    if (!txResult.success) {
      await client.query("ROLLBACK");
      throw new Error(txResult.error || "Blockchain proposal failed");
    }

    // 4. Update DB
    const chainId = txResult.blockchainPolicyId !== undefined && txResult.blockchainPolicyId !== -1
      ? txResult.blockchainPolicyId
      : -1;

    await client.query(
      `UPDATE policies 
       SET transaction_hash = $1, 
           blockchain_policy_id = $2,
           votes_for = 1 
       WHERE policy_id = $3`,
      [txResult.txHash, chainId, policyId]
    );

    await client.query("COMMIT");

    res.json({ success: true, policyId, txHash: txResult.txHash, blockchainId: chainId });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error creating proposal:", error);
    res.status(500).json({ success: false, error: "Failed to create proposal" });
  } finally {
    client.release();
  }
});

// GET /votes/:id - Get voting status for a specific policy
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const policyId = req.params.id;
    const orgId = req.user!.organization_id;

    const result = await pool.query(`
            SELECT 
                p.policy_id as id,
                p.title,
                p.description,
                p.policy_content as metrics,
                p.status,
                p.created_at,
                p.proposer_org_id as proposer_id,
                org.name as proposer_name,
                (SELECT COUNT(*) FROM policy_votes v WHERE v.policy_id = p.policy_id AND v.vote = true) as yes_votes,
                (SELECT COUNT(*) FROM policy_votes v WHERE v.policy_id = p.policy_id AND v.vote = false) as no_votes,
                (SELECT vote FROM policy_votes v WHERE v.policy_id = p.policy_id AND v.organization_id = $1 LIMIT 1) as my_vote,
                (SELECT json_agg(json_build_object('organization_id', v.organization_id, 'vote', v.vote)) FROM policy_votes v WHERE v.policy_id = p.policy_id) as voters
            FROM policies p
            JOIN organizations org ON p.proposer_org_id = org.organization_id
            WHERE p.policy_id = $2
        `, [orgId, policyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Policy not found" });
    }

    let policy = result.rows[0];
    try {
      policy.metrics = typeof policy.metrics === 'string' ? JSON.parse(policy.metrics) : policy.metrics;
    } catch (e) { policy.metrics = {} }

    res.json({ success: true, policy });
  } catch (error: any) {
    console.error("Error fetching policy details:", error);
    res.status(500).json({ success: false, error: "Failed to fetch policy details" });
  }
});

// POST /simulate - Run a policy simulation
import { simulationService } from "../services/simulationService.js";

router.post("/simulate", async (req: AuthRequest, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics) {
      return res.status(400).json({ success: false, error: "Metrics required" });
    }

    // Run simulation (read-only)
    const result = await simulationService.runSimulation(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Simulation error:", error);
    res.status(500).json({ success: false, error: "Simulation failed" });
  }
});

// POST /vote - Vote on a policy & Check Threshold
router.post("/vote", async (req: AuthRequest, res) => {
  try {
    const { policyId, vote } = req.body; // vote: boolean
    const voterId = req.user!.organization_id;

    // 1. Check if policy exists and get proposer
    const policyCheck = await pool.query('SELECT proposer_org_id, status FROM policies WHERE policy_id = $1', [policyId]);
    if (policyCheck.rows.length === 0) return res.status(404).json({ success: false, error: "Policy not found" });
    
    if (policyCheck.rows[0].status !== 'Proposed') {
       return res.status(400).json({ success: false, error: "This policy is no longer in the voting phase." });
    }

    // 2. Record Vote
    try {
      await pool.query(
        `INSERT INTO policy_votes (policy_id, organization_id, vote, created_at) VALUES ($1, $2, $3, NOW())`,
        [policyId, voterId, vote]
      );
    } catch (e: any) {
      if (e.code === '23505') { // Unique violation
        return res.status(400).json({ success: false, error: "You have already voted on this policy" });
      }
      throw e;
    }

    // 3. Sync Database Fields (Increment counts)
    if (vote) {
      await pool.query(`UPDATE policies SET votes_for = votes_for + 1 WHERE policy_id = $1`, [policyId]);
    } else {
      await pool.query(`UPDATE policies SET votes_against = votes_against + 1 WHERE policy_id = $1`, [policyId]);
    }

    // 4. Get fresh counts for threshold check
    const countsRes = await pool.query(`
        SELECT 
            votes_for as yes_votes, 
            votes_against as no_votes,
            organ_type,
            replaces_id
        FROM policies WHERE policy_id = $1
    `, [policyId]);

    const yesVotes = parseInt(countsRes.rows[0].yes_votes || '0');
    const noVotes = parseInt(countsRes.rows[0].no_votes || '0');
    const organ_type = countsRes.rows[0].organ_type;
    const replaces_id = countsRes.rows[0].replaces_id;

    // CONSORTIUM LOGIC (Pilot: 6 members)
    // Pass = 4 Yes votes (67% majority)
    // Reject = 3 No votes (Impossible to pass)
    const majorityThreshold = 4;
    const rejectionThreshold = 3;

    let newStatus = 'Proposed'; // Default stays Proposed

    // 5. Blockchain Integration
    try {
      await orgPolicyVotingService.voteOnPolicy("Org_" + voterId, policyId, vote);
    } catch (bcError: any) {
      console.error("❌ [Blockchain] Vote Failed:", bcError.message);
      return res.status(500).json({ success: false, error: "Blockchain Transaction Failed: " + (bcError.reason || "Unknown Error") });
    }

    // 6. Threshold Check
    if (yesVotes >= majorityThreshold) {
      newStatus = 'Active';
      
      // OPTION B: Superseding Logic
      if (replaces_id) {
        await pool.query(`UPDATE policies SET status = 'Archived', updated_at = NOW() WHERE policy_id = $1`, [replaces_id]);
      } else if (organ_type) {
        await pool.query(`UPDATE policies SET status = 'Archived', updated_at = NOW() WHERE organ_type = $1 AND status = 'Active' AND policy_id != $2`, [organ_type, policyId]);
      }

      await pool.query(`UPDATE policies SET status = 'Active', updated_at = NOW() WHERE policy_id = $1`, [policyId]);
      console.log(`✅ Policy ${policyId} is now ACTIVE (${yesVotes}/6 YES votes)`);
      
    } else if (noVotes >= rejectionThreshold) {
      newStatus = 'Rejected';
      await pool.query(`UPDATE policies SET status = 'Rejected', updated_at = NOW() WHERE policy_id = $1`, [policyId]);
      console.log(`❌ Policy ${policyId} REJECTED (${noVotes}/6 NO votes)`);
    }

    res.json({ success: true, newStatus });

  } catch (error: any) {
    console.error("Error voting:", error);
    res.status(500).json({ success: false, error: "Failed to vote" });
  }
});


// POST /pause - Pause an active policy
router.post("/pause", async (req: AuthRequest, res) => {
  try {
    const { policyId } = req.body;

    // Only 'Active' policies can be paused
    const result = await pool.query(
      `UPDATE policies SET status = 'Paused', updated_at = NOW()
       WHERE policy_id = $1 AND status = 'Active' 
       RETURNING policy_id`,
      [policyId]
    );

    if (result.rowCount === 0) {
      // Try checking if it's already paused to toggle back? 
      // User asked to "pause active policies". Let's assume toggle for better UX or just pause.
      // Let's implement Toggle: Paused -> Active
      const toggleRes = await pool.query(
        `UPDATE policies SET status = 'Active', updated_at = NOW()
             WHERE policy_id = $1 AND status = 'Paused'
             RETURNING policy_id`,
        [policyId]
      );

      if (toggleRes.rowCount > 0) {
        return res.json({ success: true, status: 'Active', message: "Policy reactivated." });
      }

      return res.status(400).json({ success: false, error: "Policy is not in a state to be paused/resumed." });
    }

    res.json({ success: true, status: 'Paused', message: "Policy paused. AI will now ignore it." });
  } catch (error: any) {
    console.error("Error pausing policy:", error);
    res.status(500).json({ success: false, error: "Failed to pause policy" });
  }
});

// DELETE /:id - Delete policy if < 24h
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const policyId = req.params.id;
    const orgId = req.user!.organization_id;

    // Check ownership and time limit (24 hours)
    // Also check status: cannot delete if 'Active' (already on chain) ? 
    // User said: "delete ... from the first 24 hrs ... so they don't want the old policy but they can't delete because blockchain"
    // Wait, if it's Active, it's on blockchain. We SHOULD NOT delete row if on blockchain.
    // We should only delete if it's still 'Proposed' (not passed yet). Or maybe if passed but < 24h?
    // "cant delete because blockchain" implies we shouldn't delete active ones.

    const check = await pool.query(
      `SELECT * FROM policy_proposals WHERE id = $1`,
      [policyId]
    );

    if (check.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const policy = check.rows[0];

    // Ownership check (or Admin?) - Let's allow Proposer
    if (policy.proposer_id !== orgId) {
      return res.status(403).json({ error: "Only the proposer can delete this policy" });
    }

    // Status Check
    if (policy.status === 'Active' || policy.status === 'Archived') {
      return res.status(400).json({ error: "Cannot delete policy that is already Active/On-Blockchain. Use Pause instead." });
    }

    // Time Check (24 hours)
    const now = new Date();
    const created = new Date(policy.created_at);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return res.status(400).json({ error: "Cannot delete policy older than 24 hours" });
    }

    // Delete
    await pool.query('DELETE FROM policy_proposals WHERE id = $1', [policyId]);

    res.json({ success: true, message: "Policy deleted successfully" });

  } catch (error: any) {
    console.error("Error deleting policy:", error);
    res.status(500).json({ success: false, error: "Failed to delete policy" });
  }
});

export default router;
