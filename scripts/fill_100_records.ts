import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const firstNamesMale = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Dhruv", "Kabir", "Rishi", "Pranav", "Rudra", "Aryan", "Aarush", "Rohit", "Rahul", "Dev", "Karan", "Siddharth", "Vikram"];
const firstNamesFemale = ["Saanvi", "Aadya", "Kiara", "Diya", "Pihu", "Prisha", "Ananya", "Myra", "Avni", "Kavya", "Riya", "Sneha", "Aditi", "Pooja", "Nisha", "Neha", "Divya", "Swati", "Shruti", "Meera", "Asha", "Sita", "Rani", "Geeta", "Jyoti"];
const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Rao", "Kumar", "Das", "Yadav", "Iyer", "Nair", "Bose", "Jain", "Chopra", "Chauhan", "Bhat", "Menon", "Trivedi"];

function generateIndianName(gender: string) {
    const list = gender === 'Female' ? firstNamesFemale : firstNamesMale;
    return `${list[Math.floor(Math.random() * list.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

async function run() {
    try {
        console.log("🚀 Starting Data Fill for Chennai & Mumbai...");
        const hRes = await pool.query(`SELECT hospital_id, name, city FROM hospitals`);
        
        // Find Chennai Apollo and Mumbai Apollo exactly as they exist by City name
        const chennaiHospital = hRes.rows.find((h: any) => h.city && h.city.toLowerCase() === 'chennai');
        const mumbaiHospital = hRes.rows.find((h: any) => h.city && h.city.toLowerCase() === 'mumbai');
        
        if (!chennaiHospital || !mumbaiHospital) {
            console.error("Could not find the hospitals in the DB:", hRes.rows);
            process.exit(1);
        }

        const CHENNAI_ID = chennaiHospital.hospital_id; 
        const MUMBAI_ID = mumbaiHospital.hospital_id;

        console.log(`Using CHENNAI_ID: '${CHENNAI_ID}', MUMBAI_ID: '${MUMBAI_ID}'`);

        // ENSURE UNIQUE CONSTRAINTS (DB HARDENING)
        await pool.query(`ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_ogid_unique`);
        await pool.query(`ALTER TABLE donors DROP CONSTRAINT IF EXISTS donors_ogid_unique`);
        
        // CLEAN SLATE (Delete existing to fix counts/duplicates)
        console.log("Cleaning stale data for target hospitals...");
        await pool.query('DELETE FROM patients WHERE hospital_id IN ($1, $2)', [CHENNAI_ID, MUMBAI_ID]);
        await pool.query('DELETE FROM donors WHERE hospital_id IN ($1, $2)', [CHENNAI_ID, MUMBAI_ID]);

        function mockHash() {
            return `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`.padEnd(66, '0');
        }        
        // PATIENTS
        console.log(`Populating Patients...`);
        const transplantPath = path.join(__dirname, '../data/Organ_Transplant.csv');
        if (fs.existsSync(transplantPath)) {
            const content = fs.readFileSync(transplantPath, 'utf-8');
            const lines = content.split('\n');

            for(const hId of [CHENNAI_ID, MUMBAI_ID]) {
                let index = 1; // RESET INDEX for each hospital
                let toAdd = hId === CHENNAI_ID ? 100 : 50; 
                let count = 1;
                while (toAdd > 0 && index < lines.length) {
                    const line = lines[index++];
                    if (!line.trim()) continue;
                    const cols = parseCSVLine(line);
                    if (cols.length < 10) continue;

                    const age = parseInt(cols[1]) || 30;
                    const gender = cols[2]?.toUpperCase() === 'FEMALE' ? 'Female' : 'Male';
                    let organ = cols[14]?.toLowerCase();
                    if (organ?.includes('kideny') || organ?.includes('kidney')) organ = 'Kidney';
                    else if (organ?.includes('heart')) organ = 'Heart';
                    else if (organ?.includes('liver')) organ = 'Liver';
                    else organ = 'Kidney';
                    
                    const conditions = [];
                    if (cols[4] === '1') conditions.push("History of Heart Attack");
                    if (cols[11] === '1') conditions.push("Diabetes");
                    const medCond = conditions.length > 0 ? conditions.join(', ') : 'None';
                    const urgency = Math.random() > 0.7 ? 'Critical' : 'High';
                    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
                    const blood = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
                    const name = generateIndianName(gender);

                    await pool.query(`
                        INSERT INTO patients (
                            hospital_id, full_name, age, gender, blood_type, organ_needed, 
                            urgency_level, medical_condition, contact_phone, contact_email, status, 
                            status_updated_at, govt_id_type, govt_id_number, organlink_id, blockchain_hash, signature_verified
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Waiting', NOW(), 'AADHAAR', $11, $12, $13, true)
                    `, [
                        hId, name, age, gender, blood, organ, urgency, medCond,
                        `999${index}000${hId.replace(/[^0-9]/g, '').substring(0,3)}`, `p${index}@kaggle.com`,
                        `ID${index}H${hId.replace(/[^0-9]/g, '').substring(0,3)}`, `OL-P-${hId.replace(/[^0-9]/g, '').substring(0,3)}-${count++}`,
                        mockHash()
                    ]);
                    toAdd--;
                }
            }
        }

        // DONORS
        console.log(`Populating Donors...`);
        const healthPath = path.join(__dirname, '../data/healthcare_dataset.csv');
        if (fs.existsSync(healthPath)) {
            const content = fs.readFileSync(healthPath, 'utf-8');
            const lines = content.split('\n');

            for(const hId of [CHENNAI_ID, MUMBAI_ID]) {
                let index = 1; // RESET INDEX for each hospital
                let toAdd = hId === CHENNAI_ID ? 100 : 50;
                let count = 1;
                while (toAdd > 0 && index < lines.length) {
                    const line = lines[index++];
                    if (!line.trim()) continue;
                    const cols = parseCSVLine(line);
                    if (cols.length < 5) continue;

                    const gender = cols[2] === 'Female' ? 'Female' : 'Male';
                    const name = generateIndianName(gender);
                    const age = parseInt(cols[1]) || 30;
                    const blood = cols[3] || 'O+';
                    const validBlood = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(blood) ? blood : 'O+';
                    const organ = ['Kidney', 'Liver', 'Heart', 'Lungs'][Math.floor(Math.random() * 4)];
                    const organJson = JSON.stringify([organ]);
                    
                    // Randomize last_check_in for demo variety
                    let lastCheckIn = 'NOW()';
                    const rand = Math.random();
                    if (rand > 0.9) {
                        lastCheckIn = "NOW() - INTERVAL '90 days'"; // Red (Inactive)
                    } else if (rand > 0.7) {
                        lastCheckIn = "NOW() - INTERVAL '40 days'"; // Orange (Action Required)
                    } else {
                        lastCheckIn = `NOW() - INTERVAL '${Math.floor(Math.random() * 20)} days'`; // Green (Active)
                    }

                    await pool.query(`
                        INSERT INTO donors (
                            hospital_id, full_name, age, gender, blood_type, organs_to_donate, 
                            medical_history, contact_phone, contact_email, status, 
                            govt_id_type, govt_id_number, organlink_id, blockchain_hash, signature_verified,
                            last_check_in
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Available', 'PAN', $10, $11, $12, true, ${lastCheckIn})
                    `, [
                        hId, name, age, gender, validBlood, organJson, 'Healthy',
                        `888${index}000${hId.replace(/[^0-9]/g, '').substring(0,3)}`, `d${index}@kaggle.com`,
                        `PAN${index}H${hId.replace(/[^0-9]/g, '').substring(0,3)}`, `OL-D-${hId.replace(/[^0-9]/g, '').substring(0,3)}-${count++}`,
                        mockHash()
                    ]);
                    toAdd--;
                }
            }
        }

        // ADD UNIQUE CONSTRAINT (Final hardening)
        console.log("Adding UNIQUE constraints...");
        await pool.query(`ALTER TABLE patients ADD CONSTRAINT patients_ogid_unique UNIQUE (organlink_id)`);
        await pool.query(`ALTER TABLE donors ADD CONSTRAINT donors_ogid_unique UNIQUE (organlink_id)`);
        
        console.log("✅ Successfully data reset and re-seeded with 100/50 counts and UNIQUE OGIDs.");
    } catch (e) {
        console.error("Fill failed:", e);
    } finally {
        await pool.end();
        console.log("Done.");
    }
}

run();
