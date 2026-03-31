import 'dotenv/config';
import { pool } from './config/database.js';

async function updateToHumanNames() {
  console.log('🌍 Updating records with realistic human names and "Action Required" states...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const firstNames = [
      'Aditya', 'Arjun', 'Aravind', 'Akash', 'Anish', 'Bhavin', 'Chirag', 'Deepak', 'Ishaan', 'Karan',
      'Kartik', 'Madhav', 'Nikhil', 'Pranav', 'Rahul', 'Rohan', 'Sahil', 'Siddharth', 'Varun', 'Yash',
      'Ananya', 'Diya', 'Ishani', 'Kavya', 'Meera', 'Neha', 'Pooja', 'Priya', 'Riya', 'Saanvi',
      'Sneha', 'Tanvi', 'Ishita', 'Amrita', 'Divya'
    ];

    const lastNames = [
      'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Kapoor', 'Khanna', 'Iyer', 'Reddy', 'Nair', 'Patel',
      'Mehta', 'Joshi', 'Kulkarni', 'Deshmukh', 'Singh', 'Kumar', 'Chawla', 'Bose', 'Chatterjee', 'Das'
    ];

    const getRandomName = () => {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      return `${first} ${last}`;
    };

    const hospitalIds = ['HOSP63218243', 'HOSP63271667'];

    for (const hId of hospitalIds) {
      // 1. Update Patients
      const patients = await client.query('SELECT patient_id FROM patients WHERE hospital_id = $1', [hId]);
      console.log(`Updating ${patients.rows.length} patients for ${hId}...`);
      
      for (let i = 0; i < patients.rows.length; i++) {
        const name = getRandomName();
        const pId = patients.rows[i].patient_id;
        
        // Every 5th patient requires action (Unverified signature)
        const isActionRequired = (i % 5 === 0);
        
        await client.query(`
          UPDATE patients 
          SET full_name = $1, 
              signature_verified = $2,
              status = $3
          WHERE patient_id = $4
        `, [name, !isActionRequired, isActionRequired ? 'Waiting' : 'Waiting', pId]);
      }

      // 2. Update Donors
      const donors = await client.query('SELECT donor_id FROM donors WHERE hospital_id = $1', [hId]);
      console.log(`Updating ${donors.rows.length} donors for ${hId}...`);
      
      for (let i = 0; i < donors.rows.length; i++) {
        const name = getRandomName();
        const dId = donors.rows[i].donor_id;
        
        // Every 4th donor requires action (Unverified)
        const isActionRequired = (i % 4 === 0);
        
        await client.query(`
          UPDATE donors 
          SET full_name = $1, 
              signature_verified = $2,
              status = $3
          WHERE donor_id = $4
        `, [name, !isActionRequired, isActionRequired ? 'Available' : 'Available', dId]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ DATABASE UPDATED WITH HUMAN NAMES AND ACTION STATES!');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error during update:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateToHumanNames();
