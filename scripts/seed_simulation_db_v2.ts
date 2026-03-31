
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
function getRandomDate(monthsBack: number) {
    const d = new Date();
    d.setMonth(d.getMonth() - getRandomInt(0, monthsBack));
    return d.toISOString();
}

async function seed() {
    try {
        console.log("Seeding multi-policy logic data...");
        // Get a valid hospital ID
        const hRes = await pool.query("SELECT hospital_id FROM hospitals LIMIT 1");
        if (hRes.rows.length === 0) throw new Error("No hospitals found.");
        const hospitalId = hRes.rows[0].hospital_id;

        // 1. Add Donors with specific Organs and Dates (for Recency Policy)
        for (let i = 0; i < 30; i++) {
            const fname = getRandom(firstNames) + " " + getRandom(lastNames);
            const blood = getRandom(bloodTypes);
            // Ensure some Hearts for Heart Policy
            const organList = [i % 5 === 0 ? "Heart" : getRandom(organs)];

            // Randomize update time: 50% fresh (<6 months), 50% old (>6 months)
            // We use 'created_at' as proxy for 'last_updated' for now or assume simulation calculates age from it
            const isFresh = Math.random() > 0.4;
            const date = getRandomDate(isFresh ? 3 : 12);

            await pool.query(`
                INSERT INTO donors (hospital_id, full_name, age, gender, blood_type, organs_to_donate, contact_phone, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [hospitalId, fname, getRandomInt(18, 65), Math.random() > 0.5 ? 'Male' : 'Female', blood, JSON.stringify(organList), '+1234567890', date]);
        }
        console.log("Added 30 detailed donors (Heart mix + Dates)");

        // 2. Add Patients with Waiting Times (for Equity Policy)
        for (let i = 0; i < 20; i++) {
            const fname = getRandom(firstNames) + " " + getRandom(lastNames);
            // 50% long waiters (> 2 years)
            const isLongWait = Math.random() > 0.5;
            const waitDate = getRandomDate(isLongWait ? 36 : 2);

            await pool.query(`
                INSERT INTO patients (hospital_id, full_name, age, gender, blood_type, organ_needed, urgency_level, contact_phone, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [hospitalId, fname, getRandomInt(10, 80), Math.random() > 0.5 ? 'Male' : 'Female',
                getRandom(bloodTypes), i % 5 === 0 ? "Heart" : "Kidney", // Mostly Kidney, some Heart
                getRandom(['Low', 'Medium', 'High', 'Critical']),
                '+1234567890', waitDate]);
        }
        console.log("Added 20 patients (Long wait times)");

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

seed();
