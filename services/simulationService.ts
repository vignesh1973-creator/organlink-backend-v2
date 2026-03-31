
import { pool } from "../config/database";

interface PolicyMetrics {
    distance_weight: number;
    urgency_weight: number;
    age_weight: number;
    compatibility_weight: number;
}

export class SimulationService {

    // Predict impact based on Policy Type and Metrics
    async runSimulation(payload: any) {
        try {
            const { metrics, policy_type, title, description } = payload;

            // 1. Fetch ALL data (we filter in memory for complex logic)
            // In real app, we would filtering SQL, but for demo simulation, memory is fine
            // We need "created_at" for Equity and Recency
            const donors = await pool.query("SELECT * FROM donors WHERE status = 'Available' LIMIT 100");
            const patients = await pool.query("SELECT * FROM patients WHERE status = 'Waiting' LIMIT 100");

            if (donors.rows.length === 0 || patients.rows.length === 0) {
                return { error: "Insufficient data" };
            }

            // Detect Scenario based on Title/Type/Desc (Simple heuristics)
            const text = (title + " " + (policy_type || "") + " " + description).toLowerCase();
            const isRecency = text.includes("recency") || metrics?.max_data_age_days;
            const isHeart = text.includes("heart") && text.includes("urgency");
            const isEquity = text.includes("equity") || text.includes("waitlist");
            const isDistance = text.includes("distance") && !isHeart; // Default logic

            // 2. Run Baseline (Generic Match)
            const baselineStats = this.calculateMatchStats(donors.rows, patients.rows, {
                distance_weight: 0.1, urgency_weight: 0.5, age_weight: 0.2, compatibility_weight: 0.2
            }, "Baseline");

            // 3. Run New Policy Logic
            let activeDonors = [...donors.rows];
            let activePatients = [...patients.rows];
            let logicType = "Standard";

            if (isRecency) {
                logicType = "Recency";
                // Filter out "old" donors (Policy 1)
                const cutoffDays = metrics.max_data_age_days || 180;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
                activeDonors = activeDonors.filter(d => new Date(d.created_at) > cutoffDate);
            } else if (isHeart) {
                logicType = "Heart";
                // Filter only Heart needs/donations (Policy 4)
                activeDonors = activeDonors.filter(d => JSON.stringify(d).includes("Heart"));
                activePatients = activePatients.filter(p => p.organ_needed === "Heart");
            }

            const newPolicyStats = this.calculateMatchStats(activeDonors, activePatients, metrics, logicType);

            return {
                success: true,
                baseline: baselineStats,
                projection: newPolicyStats,
                diff: {
                    avg_distance: newPolicyStats.avg_distance - baselineStats.avg_distance,
                    matches_found: newPolicyStats.matches_found - baselineStats.matches_found,
                    efficiency_score: newPolicyStats.efficiency_score - baselineStats.efficiency_score
                },
                debug_logic: logicType
            };

        } catch (error) {
            console.error("Simulation failed:", error);
            throw error;
        }
    }

    private calculateMatchStats(donors: any[], patients: any[], metrics: PolicyMetrics, logicType: string) {
        let matchCount = 0;
        let totalDistance = 0;
        let totalScore = 0;

        for (const donor of donors) {
            let bestMatch: any = null;
            let highestScore = -1;

            for (const recipient of patients) {
                // Basic compatibility
                if (donor.blood_type !== recipient.blood_type) continue;

                // Deterministic Distance
                const seed = (donor.id || 0) + (recipient.id || 0);
                const distance = (seed * 9301 + 49297) % 500;

                // --- SCORING LOGIC VARIANTS ---
                let score = 0;

                if (logicType === "Heart") {
                    // Urgency is paramount
                    const urgScore = recipient.urgency_level === 'Critical' ? 1.0 :
                        recipient.urgency_level === 'High' ? 0.7 : 0.3;
                    const compat = 0.8; // Mocked high compat for hearts
                    score = (urgScore * (metrics.urgency_weight || 0.5)) +
                        (compat * (metrics.compatibility_weight || 0.3));

                } else if (logicType === "Equity") {
                    // Waiting Time matters
                    const waitMonths = (Date.now() - new Date(recipient.created_at).getTime()) / (1000 * 3600 * 24 * 30);
                    const normWait = Math.min(waitMonths, 60) / 60; // Cap at 5 years
                    score = (normWait * (metrics.equity_weight || 0.4)) +
                        (0.5 * (metrics.urgency_weight || 0.4));

                } else {
                    // Standard / Distance / Recency (Recency just filters, uses standard score)
                    const normDistance = Math.max(0, 1000 - distance) / 1000;
                    const normUrgency = (recipient.urgency_level === 'High' ? 1.0 : 0.5);
                    score = (
                        (normDistance * (metrics.distance_weight || 0.3)) +
                        (normUrgency * (metrics.urgency_weight || 0.3))
                    );
                }

                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = { recipient, distance, score };
                }
            }

            // Thresholds vary by logic
            const threshold = logicType === "Heart" ? 0.6 : 0.4;

            if (bestMatch && highestScore > threshold) {
                matchCount++;
                totalDistance += bestMatch.distance;
                totalScore += highestScore;
            }
        }

        return {
            matches_found: matchCount,
            avg_distance: matchCount > 0 ? Math.round(totalDistance / matchCount) : 0,
            efficiency_score: matchCount > 0 ? parseFloat((totalScore / matchCount).toFixed(2)) : 0
        };
    }
}

export const simulationService = new SimulationService();
