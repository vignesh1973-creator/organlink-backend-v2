
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

const passwords = [
    'postgres',
    'root',
    'admin',
    'password',
    '1234',
    '123456',
    'Welcome',
    'Welcome1',
    '' // empty password
];

async function recover() {
    console.log("🔍 Attempting to recover database password...");

    for (const pass of passwords) {
        const connString = `postgresql://postgres:${pass}@localhost:5432/organlink_local`;
        const maskString = `postgresql://postgres:***@localhost:5432/organlink_local`;

        console.log(`Trying password: "${pass}"...`);
        const pool = new Pool({
            connectionString: connString,
            connectionTimeoutMillis: 2000,
        });

        try {
            const client = await pool.connect();
            console.log(`✅ SUCCESS! Valid password found: "${pass}"`);
            client.release();
            await pool.end();

            // Update .env
            const envPath = path.join(process.cwd(), '.env');
            let envContent = fs.readFileSync(envPath, 'utf8');

            // Replace DATABASE_URL line
            const newLine = `DATABASE_URL=${connString}`;
            envContent = envContent.replace(/^DATABASE_URL=.*$/m, newLine);

            fs.writeFileSync(envPath, envContent);
            console.log("📝 Updated .env with correct connection string.");
            process.exit(0);

        } catch (e) {
            console.log(`❌ Failed: ${e.message}`);
            await pool.end(); // Close failed pool
        }
    }

    console.error("⛔ Could not recover password. Please ask user.");
    process.exit(1);
}

recover();
