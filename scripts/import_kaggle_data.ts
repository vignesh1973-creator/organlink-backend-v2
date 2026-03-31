
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

// Helper to parse CSV line respecting quotes (simple version)
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

async function importData() {
    try {
        console.log("🚀 Starting Kaggle Data Impact...");

        // 1. Import Patients from Organ_Transplant.csv
        const transplantPath = path.join(__dirname, '../data/Organ_Transplant.csv');
        if (fs.existsSync(transplantPath)) {
            console.log("Reading Organ_Transplant.csv for PATIENTS...");
            const content = fs.readFileSync(transplantPath, 'utf-8');
            const lines = content.split('\n');
            // Header: ID,Age,Gender,Bp,heart Attack,...Transplant,...
            // Indices: Age=1, Gender=2, BP=3, Transplant=14

            let count = 0;
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = parseCSVLine(lines[i]);
                if (cols.length < 10) continue;

                const age = parseInt(cols[1]) || 30;
                const gender = cols[2]?.toUpperCase() || 'OTHER';
                let organ = cols[14]?.toLowerCase();

                // Normalization
                if (organ?.includes('kideny') || organ?.includes('kidney')) organ = 'Kidney';
                else if (organ?.includes('heart')) organ = 'Heart';
                else if (organ?.includes('liver')) organ = 'Liver';
                else organ = 'Kidney'; // Default

                const conditions = [];
                if (cols[4] === '1') conditions.push("History of Heart Attack");
                if (cols[11] === '1') conditions.push("Diabetes");

                const bloodType = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)]; // Mocked as not in this CSV

                // Upsert Patient
                await pool.query(`
                    INSERT INTO patients (
                        dAppId, name, age, gender, blood_type, organ_needed, 
                        urgency_level, location, status, medical_conditions, created_at,
                        govt_id_type, govt_id_number, organlink_id
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, 
                        $7, $8, $9, $10, NOW(),
                        'AADHAAR', $11, $12
                    )
                `, [
                    `kag_pat_${i}`,
                    `Kaggle Patient ${i}`,
                    age,
                    gender === 'FEMALE' ? 'Female' : 'Male',
                    bloodType,
                    organ,
                    Math.random() > 0.7 ? 'Critical' : 'High', // Skew towards High urgency
                    'Mumbai', // Mock location
                    'Waiting',
                    JSON.stringify(conditions),
                    `1234${10000000 + i}`,
                    `OL-P-KAG-${i}`
                ]);
                count++;
                if (count >= 50) break; // Limit to 50 for speed
            }
            console.log(`✅ Imported ${count} Patients from Kaggle.`);
        }

        // 2. Import Donors from healthcare_dataset.csv
        const healthPath = path.join(__dirname, '../data/healthcare_dataset.csv');
        if (fs.existsSync(healthPath)) {
            console.log("Reading healthcare_dataset.csv for DONORS...");
            const content = fs.readFileSync(healthPath, 'utf-8');
            const lines = content.split('\n');
            // Header: Patient_ID,Age,Gender,Blood_Type,Height...

            let count = 0;
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = parseCSVLine(lines[i]);

                const age = parseInt(cols[1]) || 30;
                const gender = cols[2] || 'Male';
                const blood = cols[3] || 'O+';

                // Ensure valid blood type
                const validBlood = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
                const bloodType = validBlood.includes(blood) ? blood : 'O+';

                // Random Organ Available
                const organs = ['Kidney', 'Liver', 'Heart', 'Lungs'];
                const organ = organs[Math.floor(Math.random() * organs.length)];

                await pool.query(`
                    INSERT INTO donors (
                        dAppId, name, age, gender, blood_type, organ_available,
                        location, status, medical_history, created_at,
                        govt_id_type, govt_id_number, organlink_id
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6,
                        $7, $8, $9, NOW(),
                        'PAN', $10, $11
                    )
                `, [
                    `kag_don_${i}`,
                    `Kaggle Donor ${i}`,
                    age,
                    gender,
                    bloodType,
                    organ,
                    'Delhi',
                    'Available',
                    '[]', // Assume healthy
                    `ABCDE${1000 + i}F`,
                    `OL-D-KAG-${i}`
                ]);
                count++;
                if (count >= 50) break;
            }
            console.log(`✅ Imported ${count} Donors from Kaggle.`);
        }

    } catch (e) {
        console.error("Import failed:", e);
    } finally {
        await pool.end();
    }
}

importData();
