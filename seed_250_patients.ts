
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const firstNamesMale = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Dhruv", "Kabir", "Rishi", "Pranav", "Rudra", "Aryan", "Aarush", "Rohit", "Rahul", "Dev", "Karan", "Siddharth", "Vikram"];
const firstNamesFemale = ["Saanvi", "Aadya", "Kiara", "Diya", "Pihu", "Prisha", "Ananya", "Myra", "Avni", "Kavya", "Riya", "Sneha", "Aditi", "Pooja", "Nisha", "Neha", "Divya", "Swati", "Shruti", "Meera", "Asha", "Sita", "Rani", "Geeta", "Jyoti"];
const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Rao", "Kumar", "Das", "Yadav", "Iyer", "Nair", "Bose", "Jain", "Chopra", "Chauhan", "Bhat", "Menon", "Trivedi"];

function generateIndianName() {
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const list = gender === 'Female' ? firstNamesFemale : firstNamesMale;
    return {
        name: `${list[Math.floor(Math.random() * list.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        gender
    };
}

const organs = [
    { type: 'Liver', weight: 120 },     // 48% - Heavy focus for the active policy
    { type: 'Kidney', weight: 50 },    // 20%
    { type: 'Heart', weight: 25 },     // 10%
    { type: 'Lung', weight: 20 },      // 8%
    { type: 'Pancreas', weight: 15 },  // 6%
    { type: 'Cornea', weight: 10 },    // 4%
    { type: 'Bone Marrow', weight: 10 } // 4%
];

const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const urgencyLevels = ["Low", "Medium", "High", "Critical"];

async function seed() {
    console.log("🚀 Starting Massive 250-Patient Seed for Chennai...");
    
    try {
        // 1. Find Chennai Hospital
        const hRes = await pool.query("SELECT hospital_id, name FROM hospitals WHERE city ILIKE '%Chennai%' OR name ILIKE '%Chennai%' LIMIT 1");
        if (hRes.rows.length === 0) {
            console.error("❌ Could not find Chennai hospital!");
            process.exit(1);
        }
        const HOSPITAL_ID = hRes.rows[0].hospital_id;
        console.log(`✅ Using Hospital: ${hRes.rows[0].name} (ID: ${HOSPITAL_ID})`);

        // 2. Clean Slate
        console.log("🧹 Cleaning existing patients for Chennai...");
        await pool.query("DELETE FROM patients WHERE hospital_id = $1", [HOSPITAL_ID]);

        // 3. Generate 250 Patients
        console.log("📝 Generating 250 clinical records...");
        
        let organPool: string[] = [];
        organs.forEach(o => {
            for (let i = 0; i < o.weight; i++) organPool.push(o.type);
        });
        // Shuffle pool
        organPool = organPool.sort(() => Math.random() - 0.5);

        for (let i = 0; i < 250; i++) {
            const { name, gender } = generateIndianName();
            const age = Math.floor(Math.random() * 80) + 5;
            const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
            const organ = organPool[i] || 'Liver'; // Fallback to liver
            const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)];
            
            // Random Indian phone
            const phone = `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`;
            const email = `${name.toLowerCase().replace(' ', '.')}@demo.medical`;
            
            // Sequential Hospital Display ID
            const displayId = i + 1;
            
            // Unique OrganLink ID
            const ogid = `OG-${HOSPITAL_ID.split('-').pop()}-P${displayId.toString().padStart(4, '0')}`;

            await pool.query(`
                INSERT INTO patients (
                    hospital_id, hospital_display_id, full_name, age, gender, blood_type, 
                    organ_needed, urgency_level, organlink_id, contact_email, contact_phone,
                    status, is_active, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Waiting', true, NOW())
            `, [HOSPITAL_ID, displayId, name, age, gender, bloodType, organ, urgency, ogid, email, phone]);
            
            if ((i + 1) % 50 === 0) console.log(`... ${i + 1}/250 seeded`);
        }

        console.log("✨ 250 Diverse Medical Records Seeded Successfully!");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await pool.end();
    }
}

seed();
