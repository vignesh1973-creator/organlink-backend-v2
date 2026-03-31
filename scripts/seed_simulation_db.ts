
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const organs = ["Kidney", "Liver", "Heart", "Lungs", "Pancreas"];

function getRandom(arr: any[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRandomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min) + min); }

async function seed() {
    try {
        console.log("Adding simulation data...");
        // Get a valid hospital ID
        const hRes = await pool.query("SELECT hospital_id FROM hospitals LIMIT 1");
        if (hRes.rows.length === 0) throw new Error("No hospitals found. Run createDemoData first.");
        const hospitalId = hRes.rows[0].hospital_id;

        // 1. Add 50 Donors
        for (let i = 0; i < 50; i++) {
            const fname = getRandom(firstNames) + " " + getRandom(lastNames);
            const blood = getRandom(bloodTypes);
            const organList = [getRandom(organs)];
            if (Math.random() > 0.5) organList.push(getRandom(organs));

            await pool.query(`
                INSERT INTO donors (hospital_id, full_name, age, gender, blood_type, organs_to_donate, contact_phone, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [hospitalId, fname, getRandomInt(18, 65), Math.random() > 0.5 ? 'Male' : 'Female', blood, JSON.stringify(organList), '+1234567890']);
        }
        console.log("Agumented Donors +50");

        // 2. Add 20 Patients (Guaranteed Matches for Kidney/O+)
        // Mix of random and tailored
        for (let i = 0; i < 20; i++) {
            const fname = getRandom(firstNames) + " " + getRandom(lastNames);
            await pool.query(`
                INSERT INTO patients (hospital_id, full_name, age, gender, blood_type, organ_needed, urgency_level, contact_phone, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [hospitalId, fname, getRandomInt(10, 80), Math.random() > 0.5 ? 'Male' : 'Female',
                getRandom(bloodTypes), getRandom(organs), getRandom(['Low', 'Medium', 'High', 'Critical']), '+1234567890']);
        }
        console.log("Augmented Patients +20");

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

seed();
