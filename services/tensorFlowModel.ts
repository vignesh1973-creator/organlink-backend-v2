import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '../data/training_set.json');

export class TensorFlowModelService {
    private model: tf.LayersModel | null = null;
    private isTraining: boolean = false;

    constructor() {
        this.init();
    }

    async init() {
        // With pure JS, we just train fresh every time.
        // It's fast enough for 1000 records (< 5 seconds).
        console.log('🚀 AI Service Initialized. Starting training...');
        await this.trainModel();
    }

    async trainModel() {
        if (this.isTraining) return;
        this.isTraining = true;

        if (!fs.existsSync(DATA_PATH)) {
            console.error('❌ Training data not found! Run generateDataset.ts first.');
            this.isTraining = false;
            return;
        }

        const rawData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

        if (rawData.length === 0) return;

        // Prepare Tensors
        const inputs: number[][] = rawData.map((d: any) => [
            d.age_diff / 100,       // Normalize Age Gap
            d.blood_match,          // 0 or 1
            d.distance_km / 2000,   // Normalize Distance
            d.urgency / 10,         // Normalize Urgency
            d.organ_match           // 0 or 1
        ]);

        const labels: number[] = rawData.map((d: any) => d.success_label);

        const xs = tf.tensor2d(inputs);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        // Build Model
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [5] }));
        model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'meanSquaredError',
            metrics: ['accuracy']
        });

        console.log('🧠 Training Neural Network (Pure JS Mode)...');

        await model.fit(xs, ys, {
            epochs: 30, // Reduced slightly for speed
            shuffle: true,
            batchSize: 32
        });

        console.log('✅ Training Complete! AI is ready to predict.');

        this.model = model;
        this.isTraining = false;

        // Cleanup
        xs.dispose();
        ys.dispose();
    }

    async predict(
        ageDiff: number,
        bloodMatch: boolean,
        distanceKm: number,
        urgency: number,
        organMatch: boolean
    ): Promise<number> {
        if (!this.model) {
            // If requested before training finishes
            return 0.5;
        }

        const inputTensor = tf.tensor2d([[
            ageDiff / 100,
            bloodMatch ? 1 : 0,
            distanceKm / 2000,
            urgency / 10,
            organMatch ? 1 : 0
        ]]);

        const prediction = this.model.predict(inputTensor) as tf.Tensor;
        const score = (await prediction.data())[0];

        inputTensor.dispose();
        prediction.dispose();

        return score;
    }
}

export const tfModelService = new TensorFlowModelService();
