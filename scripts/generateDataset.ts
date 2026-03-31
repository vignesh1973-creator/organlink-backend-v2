import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TrainingRecord {
    age_diff: number;      // Absolute difference in age
    blood_match: number;   // 1 for compatible, 0 for incompatible
    distance_km: number;   // Distance in Kilometers
    urgency: number;       // 1 (Low) to 10 (Critical)
    organ_match: number;   // 1 for same organ, 0 for different
    success_label: number; // 0 (Fail) to 1 (Success)
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGANS = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas'];

function getBloodCompatibility(donor: string, patient: string): number {
    if (donor === patient) return 1;
    if (donor === 'O-') return 1;
    if (patient === 'AB+') return 1;
    // Simplified rules for training data generation
    return 0;
}

function generateDataset(count: number) {
    const dataset: TrainingRecord[] = [];

    console.log(`Generating ${count} synthetic records...`);

    for (let i = 0; i < count; i++) {
        // 1. Generate Random Attributes
        const patientAge = 10 + Math.floor(Math.random() * 70); // 10-80
        const donorAge = 18 + Math.floor(Math.random() * 50);   // 18-68
        const ageDiff = Math.abs(patientAge - donorAge);

        const patientBlood = BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)];
        const donorBlood = BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)];
        const bloodMatch = getBloodCompatibility(donorBlood, patientBlood);

        const distanceKm = Math.floor(Math.random() * 2000); // 0 - 2000km

        // Weighted urgency (fewer Critical cases)
        const urgencyRoll = Math.random();
        let urgency = 1; // Low
        if (urgencyRoll > 0.9) urgency = 10; // Critical
        else if (urgencyRoll > 0.7) urgency = 7; // High
        else if (urgencyRoll > 0.4) urgency = 4; // Medium

        const patientOrgan = ORGANS[Math.floor(Math.random() * ORGANS.length)];
        // 80% chance or organ match (to have enough positive samples)
        const donorOrgan = Math.random() > 0.2 ? patientOrgan : ORGANS[Math.floor(Math.random() * ORGANS.length)];
        const organMatch = patientOrgan === donorOrgan ? 1 : 0;

        // 2. Calculate "Ground Truth" Label (The Teacher)
        // We use a strict logic here, so the AI learns this logic.

        let score = 0.5; // Base probability

        // Rules the AI needs to learn:
        if (organMatch === 0) score = 0; // Wrong organ = Fail
        else if (bloodMatch === 0) score = 0.1; // Incompatible blood = Very Low chance
        else {
            // Base Good Match
            score = 0.7;

            // Age Penalty
            if (ageDiff > 20) score -= 0.1;
            if (ageDiff > 40) score -= 0.2;

            // Distance Penalty
            if (distanceKm > 1000) score -= 0.1;
            if (distanceKm < 50) score += 0.1; // Local bonus

            // Urgency Boost (Critical patients get priority)
            if (urgency === 10) score += 0.2;
            if (urgency >= 7) score += 0.1;
        }

        // Clamp score 0-1
        score = Math.max(0, Math.min(1, score));

        dataset.push({
            age_diff: ageDiff,
            blood_match: bloodMatch,
            distance_km: distanceKm,
            urgency: urgency,
            organ_match: organMatch,
            success_label: score
        });
    }

    // 3. Save to File
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, 'training_set.json');
    fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));

    console.log(`\n✅ Dataset saved to: ${filePath}`);
    console.log(`Total Records: ${dataset.length}`);

    // Preview
    console.log('\nSample Record:');
    console.log(dataset[0]);
}

generateDataset(1000);
