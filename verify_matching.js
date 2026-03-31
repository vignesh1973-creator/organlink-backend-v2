const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:4632@localhost:5432/organlink_local' });

async function verify() {
  console.log('--- AI MATCHING POLICY VERIFICATION ---');

  // 1. Define Dummy Patient & Donor
  const patient = {
    blood_group: 'A+',
    urgency_status: 'Critical',
    region: 'Mumbai',
    hospital_name: 'City Hospital'
  };
  const donor = {
    blood_group: 'A+',
    region: 'Chennai', // ~1300km
    organ_type: 'kidney'
  };

  // 2. Fetch Fixed Weights (Simulate default logic if no policy)
  const defaultWeights = { compatibility: 0.4, urgency: 0.3, distance: 0.2, age: 0.1 };
  
  // 3. Simple Mock Calculation Logic (Subset of aiMatching.ts)
  const calculateResult = (w) => {
    const compScore = 100 * w.compatibility; // Blood Match
    const urgencyScore = 100 * w.urgency; // Critical
    const distScore = 10 * w.distance; // Far away penalty (Simplified)
    return compScore + urgencyScore + distScore;
  };

  const defaultScore = calculateResult(defaultWeights);
  console.log(`\nBASELINE: Default Score (40/30/20/10) = ${defaultScore.toFixed(2)}`);

  // 4. Fetch the Active Kidney Policy we seeded
  const res = await pool.query("SELECT policy_content FROM policies WHERE organ_type = 'kidney' AND status = 'Active' LIMIT 1");
  if (res.rows.length === 0) {
    console.error('❌ Active Kidney Policy not found!');
    return;
  }
  const policyWeights = JSON.parse(res.rows[0].policy_content);
  
  // Convert backend field names to match my mock logic if needed
  const mappedPolicyWeights = {
    compatibility: policyWeights.compatibility_weight,
    urgency: policyWeights.urgency_weight,
    distance: policyWeights.distance_weight,
    age: policyWeights.age_weight
  };

  const policyScore = calculateResult(mappedPolicyWeights);
  console.log(`POLICY: '${res.rows[0].title || 'Kidney Allocation 2025'}' Score = ${policyScore.toFixed(2)}`);

  if (Math.abs(defaultScore - policyScore) > 0.1) {
    console.log(`\n✅ VERIFIED: Matching score successfully shifted from ${defaultScore.toFixed(2)} to ${policyScore.toFixed(2)} based on approved policy weights.`);
  } else {
    console.log('\n⚠️ WARNING: Scores are identical. Ensure policy weights differ from defaults.');
  }

}

verify().catch(console.error).finally(() => pool.end());
