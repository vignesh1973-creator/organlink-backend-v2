import 'dotenv/config';
import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

async function seedFinalData() {
  console.log('🚀 Starting Final Data Seeding for Demo (V4 - Final Check)...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create Hospitals
    const hospitals = [
      {
        id: 'HOSP63218243',
        name: 'Fortis Hospital',
        email: 'fortis@organlink.com',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        address: 'First Main Road, Gandhi Nagar, Adyar'
      },
      {
        id: 'HOSP63271667',
        name: 'New Med Hospital',
        email: 'newmed@organlink.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        address: 'Western Express Highway, Goregaon East'
      }
    ];

    const passwordHash = await bcrypt.hash('Hospital@123', 10);

    for (const h of hospitals) {
      console.log(`🏥 Upserting hospital: ${h.name} (${h.id})`);
      await client.query(`
        INSERT INTO hospitals (hospital_id, name, email, password_hash, city, state, country, address, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (hospital_id) DO UPDATE SET 
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          address = EXCLUDED.address
      `, [h.id, h.name, h.email, passwordHash, h.city, h.state, h.country, h.address]);
    }

    // 2. Add More Policies
    console.log('📜 Adding extra policies for demo...');
    const extraPolicies = [
      {
        title: 'Global Reciprocity Agreement',
        description: 'Allows international organ exchange between certified countries.',
        content: 'Establish bilateral treaties for urgent organ sharing.',
        category: 'Legal'
      },
      {
        title: 'Real-time Transport Optimization',
        description: 'Prioritizes matches within 2 hours of drone/air transport.',
        content: 'Logistical weight adjustment for distance.',
        category: 'Logistics'
      },
      {
        title: 'Pediatric First Allocation',
        description: 'Mandatory priority for patients under 18 years old.',
        content: 'Automatic ranking boost for pediatric cases.',
        category: 'Bioethics'
      }
    ];

    for (const p of extraPolicies) {
      const exists = await client.query('SELECT 1 FROM policies WHERE title = $1', [p.title]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO policies (title, description, policy_content, category, status)
          VALUES ($1, $2, $3, $4, 'approved')
        `, [p.title, p.description, p.content, p.category]);
      }
    }

    // 3. Generate 75 Patients and 75 Donors per hospital
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const organs = ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea'];
    const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];
    const genders = ['Male', 'Female'];

    for (const h of hospitals) {
      console.log(`👤 Seeding 75 patients and 75 donors for ${h.name}...`);
      
      for (let i = 1; i <= 75; i++) {
        const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
        const organ = organs[Math.floor(Math.random() * organs.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const age = 18 + Math.floor(Math.random() * 60);
        
        const patientName = `${h.name} Patient ${i}`;
        const donorName = `${h.name} Donor ${i}`;
        
        const ogid_p = `OGID-P-${h.id}-${i}`;
        const ogid_d = `OGID-D-${h.id}-${i}`;

        // Insert Patient
        await client.query(`
          INSERT INTO patients 
          (hospital_id, hospital_display_id, full_name, age, gender, blood_type, organlink_id, organ_needed, urgency_level, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Waiting')
          ON CONFLICT (organlink_id) DO NOTHING
        `, [h.id, 1000 + i, patientName, age, gender, bloodType, ogid_p, organ, urgencyLevels[Math.floor(Math.random() * 4)]]);

        // Insert Donor
        await client.query(`
          INSERT INTO donors 
          (hospital_id, hospital_display_id, full_name, age, gender, blood_type, organlink_id, organs_to_donate, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Available')
          ON CONFLICT (organlink_id) DO NOTHING
        `, [h.id, 2000 + i, donorName, age, gender, bloodType, ogid_d, JSON.stringify([organ])]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ SEEDING COMPLETE FOR FORTIS AND NEW MED!');
    
    // Final Count Verification
    for (const h of hospitals) {
        const pCount = await client.query('SELECT COUNT(*) FROM patients WHERE hospital_id = $1', [h.id]);
        const dCount = await client.query('SELECT COUNT(*) FROM donors WHERE hospital_id = $1', [h.id]);
        console.log(`📊 ${h.name} results -> Patients: ${pCount.rows[0].count}, Donors: ${dCount.rows[0].count}`);
    }

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error during seeding:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedFinalData();
