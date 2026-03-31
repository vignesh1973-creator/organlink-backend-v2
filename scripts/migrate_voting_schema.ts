
import 'dotenv/config';
import { pool } from '../config/database.js';

async function migrateVotingSchema() {
    const client = await pool.connect();
    try {
        console.log('Starting Voting Schema Migration...');

        // 1. Policy Proposals Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS policy_proposals (
        id SERIAL PRIMARY KEY,
        proposer_id INTEGER REFERENCES organizations(organization_id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        metrics JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'Proposed', -- Proposed, Active, Rejected, Paused, Archived
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        blockchain_tx VARCHAR(255) DEFAULT NULL
      );
    `);
        console.log('✅ policy_proposals table created.');

        // 2. Policy Votes Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS policy_votes (
        vote_id SERIAL PRIMARY KEY,
        policy_id INTEGER REFERENCES policy_proposals(id) ON DELETE CASCADE,
        voter_id INTEGER REFERENCES organizations(organization_id),
        vote BOOLEAN NOT NULL, -- true = YES, false = NO
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(policy_id, voter_id) -- One vote per org per policy
      );
    `);
        console.log('✅ policy_votes table created.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrateVotingSchema();
