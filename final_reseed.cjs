const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function reseed() {
  await pool.query('DELETE FROM policy_votes');
  await pool.query('DELETE FROM policies');
  console.log('🗑️ Previous policies and votes cleared');

  const commonWeights = { compatibility_weight: 0.3, urgency_weight: 0.3, distance_weight: 0.3, age_weight: 0.1 };
  
  const pols = [
    { title: 'Global Kidney Allocation Policy', org_id: 1, organ: 'kidney' },
    { title: 'National Lung Priority Protocol', org_id: 2, organ: 'lung' },
    { title: 'Heart Transplant Urgency Standard', org_id: 3, organ: 'heart' },
    { title: 'Liver Distance Minimization Act', org_id: 4, organ: 'liver' },
    { title: 'Pancreas Sharing Guidelines', org_id: 5, organ: 'pancreas' }
  ];

  for (const p of pols) {
    const res = await pool.query(
      `INSERT INTO policies (title, description, status, proposer_org_id, organ_type, policy_type, policy_content, created_at, updated_at) 
       VALUES ($1, $2, 'Proposed', $3, $4, $5, $6, NOW(), NOW()) RETURNING policy_id`,
      [p.title, `Consortium approved ${p.organ} policy for efficient allocation.`, p.org_id, p.organ, 'Matching Algorithm', JSON.stringify(commonWeights)]
    );
    
    const pid = res.rows[0].policy_id;
    // Every policy starts with a 'YES' vote from the proposer (Best Practice)
    await pool.query(
      "INSERT INTO policy_votes (policy_id, organization_id, vote, created_at) VALUES ($1, $2, true, NOW())",
      [pid, p.org_id]
    );
    console.log(`✅ Seeded: ${p.title} (1/6 votes, Proposed)`);
  }
}

reseed().catch(console.error).finally(() => pool.end());
