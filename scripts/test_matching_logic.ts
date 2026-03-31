
import 'dotenv/config';
import { aiMatchingService } from '../services/aiMatching';
import { pool } from '../config/database';

async function testMatching() {
    try {
        console.log("--- DEBUGGING POLICY MATCHING ---");

        // 1. Check Policies in DB
        const policies = await pool.query("SELECT policy_id, title, status FROM policies");
        console.table(policies.rows);

        // 2. Identify a Kidney Patient
        const patientRes = await pool.query("SELECT * FROM patients WHERE organ_needed = 'Kidney' LIMIT 1");
        if (patientRes.rows.length === 0) {
            console.log("No Kidney patients found for test.");
            return;
        }
        const patient = patientRes.rows[0];
        console.log(`Testing with Patient: ${patient.full_name} (${patient.organ_needed})`);

        // 3. Run Matching
        const result = await aiMatchingService.findMatches({
            patient_id: patient.patient_id,
            hospital_id: patient.hospital_id,
            organs_type: patient.organ_needed, // Note: Interface might say organ_type? Checking service...
            organ_type: patient.organ_needed,
            blood_type: patient.blood_type,
            urgency_level: patient.urgency_level
        } as any);

        console.log("\n--- MATCH RESULTS ---");
        console.log("Applied Policies:", result.applied_policies);
        console.log("Blockchain Policies Applied Flag:", result.blockchain_policies_applied);

        if (result.matches.length > 0) {
            console.log("Top Match Explanation:", result.matches[0].explanation);
            console.log("Top Match Policy Applied:", result.matches[0].policy_applied);
            console.log("Top Match Policy Name:", result.matches[0].policy_name);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

testMatching();
