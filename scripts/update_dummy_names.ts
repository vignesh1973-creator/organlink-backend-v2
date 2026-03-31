import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const firstNamesMale = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Dhruv", "Kabir", "Rishi", "Pranav", "Rudra", "Aryan", "Aarush", "Rohit", "Rahul", "Dev", "Karan", "Siddharth", "Vikram"];
const firstNamesFemale = ["Saanvi", "Aadya", "Kiara", "Diya", "Pihu", "Prisha", "Ananya", "Myra", "Avni", "Kavya", "Riya", "Sneha", "Aditi", "Pooja", "Nisha", "Neha", "Divya", "Swati", "Shruti", "Meera", "Asha", "Sita", "Rani", "Geeta", "Jyoti"];
const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Rao", "Kumar", "Das", "Yadav", "Iyer", "Nair", "Bose", "Jain", "Chopra", "Chauhan", "Bhat", "Menon", "Trivedi"];

function generateIndianName(gender: string) {
    const firstNames = gender === 'Male' ? firstNamesMale : firstNamesFemale;
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
}

async function run() {
    console.log("Starting DB update to replace non-human names...");
    
    // PATIENTS
    const patients = await pool.query(`SELECT patient_id, full_name, gender, organlink_id FROM patients WHERE full_name ILIKE '%Kaggle%'`);
    console.log(`Found ${patients.rows.length} dummy patients.`);
    for (const p of patients.rows) {
        const hName = generateIndianName(p.gender || 'Male');
        await pool.query('UPDATE patients SET full_name = $1 WHERE patient_id = $2', [hName, p.patient_id]);
    }

    // DONORS
    const donors = await pool.query(`SELECT donor_id, full_name, gender, organlink_id FROM donors WHERE full_name ILIKE '%Kaggle%'`);
    console.log(`Found ${donors.rows.length} dummy donors.`);
    for (const d of donors.rows) {
        const hName = generateIndianName(d.gender || 'Male');
        await pool.query('UPDATE donors SET full_name = $1 WHERE donor_id = $2', [hName, d.donor_id]);
    }
    
    console.log("Done! Names updated to realistic Indian names.");
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
