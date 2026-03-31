
import 'dotenv/config';
import { pool } from './config/database.js';

async function seedExtendedDemoData() {
  console.log('--- STARTING EXTENDED DEMO DATA SEEDING ---');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure New Hospitals Exist
    console.log('🏥 Registering new hospitals...');
    const hospitals = [
      { id: 'HOSP63218243', name: 'Fortis Hospital', city: 'Chennai', location: 'Chennai, India' },
      { id: 'HOSP63271667', name: 'New Med Hospital', city: 'Mumbai', location: 'Mumbai, India' }
    ];

    for (const h of hospitals) {
      await client.query(`
        INSERT INTO hospitals (hospital_id, hospital_name, city, location, email, password, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (hospital_id) DO UPDATE SET hospital_name = $2, city = $3, location = $4
      `, [h.id, h.name, h.city, h.location, `${h.name.toLowerCase().replace(' ', '')}@organlink.com`, '$2b$10$YourHashedPasswordHere', 'active']);
    }

    // 2. Add More Policies
    console.log('📜 Adding new governance policies...');
    const policies = [
      {
        id: 'POL_KIDNEY_COMPATIBILITY_2026',
        title: 'Kidney Compatibility Standardization Act',
        description: 'Standardizes HLA typing across the network to prioritize matches with <2 mismatches.',
        category: 'Kidney',
        content: { weight: 45, priority: 'HLA Match' }
      },
      {
        id: 'POL_HEART_URGENCY_FIX',
        title: 'Emergency Heart Allocation Protocol',
        description: 'Automates immediate priority for patients in Status 1A heart failure regardless of distance.',
        category: 'Heart',
        content: { weight: 60, priority: 'Medical Urgency' }
      },
      {
        id: 'POL_MULTIORGAN_SYNERGY',
        title: 'Multi-Organ Allocation Policy',
        description: 'Coordinates multi-organ transplants (e.g., Kidney-Pancreas) to occur at a single facility.',
        category: 'General',
        content: { weight: 25, priority: 'Surgical Efficiency' }
      }
    ];

    for (const p of policies) {
      await client.query(`
        INSERT INTO governance_policies (policy_id, title, description, category, policy_content, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        ON CONFLICT (policy_id) DO NOTHING
      `, [p.id, p.title, p.description, p.category, JSON.stringify(p.content)]);
    }

    // 3. Seed Patients and Donors (75 each for new hospitals)
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const organs = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];
    const urgency = ['Low', 'Medium', 'High', 'Critical'];
    const genders = ['Male', 'Female', 'Other'];

    for (const h of hospitals) {
      console.log(`👤 Seeding 75 patients and donors for ${h.name}...`);
      
      for (let i = 1; i <= 75; i++) {
        const pId = `P_${h.id}_${1000 + i}`;
        const dId = `D_${h.id}_${1000 + i}`;
        const bType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
        const organ = organs[Math.floor(Math.random() * organs.length)];
        
        // Patient
        await client.query(`
          INSERT INTO patients (patient_id, hospital_id, full_name, age, gender, blood_type, organ_needed, urgency_level, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', NOW())
          ON CONFLICT (patient_id) DO NOTHING
        `, [pId, h.id, `Patient ${h.city} ${i}`, 20 + Math.floor(Math.random() * 50), genders[i % 3], bType, organ, urgency[Math.floor(Math.random() * 4)]]);

        // Donor
        const donorOrgan = organs[Math.floor(Math.random() * organs.length)];
        await client.query(`
          INSERT INTO donors (donor_id, hospital_id, full_name, age, gender, blood_type, organ_type, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available', NOW())
          ON CONFLICT (donor_id) DO NOTHING
        `, [dId, h.id, `Donor ${h.city} ${i}`, 20 + Math.floor(Math.random() * 50), genders[i % 3], bType, donorOrgan]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ EXTENDED DATA SEEDING COMPLETE!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Data seeding failed:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedExtendedDemoData();
