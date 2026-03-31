const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function seed() {
  const commonWeights = { compatibility_weight: 0.3, urgency_weight: 0.3, distance_weight: 0.3, age_weight: 0.1 };
  
  const policies = [
    { title: 'Global Kidney Allocation Policy', org_id: 1, organ: 'kidney', status: 'Active' },
    { title: 'National Lung Priority Protocol', org_id: 2, organ: 'lung', status: 'Active' },
    { title: 'Heart Transplant Urgency Standard', org_id: 3, organ: 'heart', status: 'Active' },
    { title: 'Liver Distance Minimization Act', org_id: 4, organ: 'liver', status: 'Active' },
    { title: 'Pancreas Sharing Guidelines', org_id: 5, organ: 'pancreas', status: 'Active' },
    { title: 'Regional Kidney Sharing V2', org_id: 1, organ: 'kidney', status: 'Proposed' },
    { title: 'Pediatric Heart Priority', org_id: 2, organ: 'heart', status: 'Proposed' }
  ];

  console.log('--- SEEDING POLICIES FOR ORGS A-E ---');

  for (const p of policies) {
    await pool.query(
      `INSERT INTO policies (title, description, status, proposer_org_id, organ_type, policy_type, policy_content, votes_for, total_votes, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [p.title, `Consortium approved ${p.organ} policy for efficient allocation.`, p.status, p.org_id, p.organ, 'Matching Algorithm', JSON.stringify(commonWeights), 5, 6]
    );
    console.log(`✅ Seeded: ${p.title} for Org ID ${p.org_id}`);
  }
}

seed().catch(console.error).finally(() => pool.end());
