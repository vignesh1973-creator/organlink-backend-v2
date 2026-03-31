
import 'dotenv/config';
import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function seedOrganizations() {
    const client = await pool.connect();
    try {
        console.log('Seeding Organizations...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('org123', salt);

        const organizations = [
            { name: 'Organization A', email: 'orga@test.com', type: 'Policy Maker' },
            { name: 'Organization B', email: 'orgb@test.com', type: 'Medical Board' },
            { name: 'Organization C', email: 'orgc@test.com', type: 'Ethics Committee' },
            { name: 'Organization D', email: 'orgd@test.com', type: 'NGO Representative' },
            { name: 'Organization E', email: 'orge@test.com', type: 'Government Body' },
        ];

        for (const org of organizations) {
            // Check if exists
            const check = await client.query('SELECT * FROM organizations WHERE email = $1', [org.email]);
            if (check.rows.length === 0) {
                // Map 'type' to 'description' column
                await client.query(`
          INSERT INTO organizations (name, email, password_hash, description, is_active, created_at)
          VALUES ($1, $2, $3, $4, true, NOW())
        `, [org.name, org.email, hashedPassword, org.type]);
                console.log(`✅ Created ${org.name} (${org.email})`);
            } else {
                console.log(`ℹ️ ${org.name} already exists.`);
            }
        }

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedOrganizations();
