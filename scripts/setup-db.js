
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    console.log('🚀 Starting Database Setup...');

    // Parse DATABASE_URL to get credentials
    // Format: postgresql://user:password@host:port/dbname
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is not defined in .env');
        process.exit(1);
    }

    // Extract connection details to connect to 'postgres' default DB first
    // This allows us to create the target DB if it doesn't exist
    const urlParts = new URL(dbUrl);
    const targetDbName = urlParts.pathname.split('/')[1]; // 'organlink_local'

    // Config for connecting to default 'postgres' database
    const defaultDbConfig = {
        user: urlParts.username,
        password: urlParts.password,
        host: urlParts.hostname,
        port: parseInt(urlParts.port || '5432'),
        database: 'postgres', // Default maintenance DB
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    };

    try {
        // 1. Create Database if not exists
        console.log(`Checking if database '${targetDbName}' exists...`);
        const pgClient = new Pool(defaultDbConfig);

        try {
            const res = await pgClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);
            if (res.rowCount === 0) {
                console.log(`Database '${targetDbName}' does not exist. Creating it...`);
                // Cannot run CREATE DATABASE inside a transaction block, so just run it directly
                // Note: CREATE DATABASE parameterization is limited, careful with sanitized string
                await pgClient.query(`CREATE DATABASE "${targetDbName}"`);
                console.log(`✅ Database '${targetDbName}' created.`);
            } else {
                console.log(`Database '${targetDbName}' already exists.`);
            }
        } catch (e) {
            console.error('Check/Create DB failed:', e.message);
            // We continue, maybe it failed because we couldn't connect to postgres db but the target db exists?
        } finally {
            await pgClient.end();
        }

        // 2. Connect to the Target Database
        console.log(`Connecting to '${targetDbName}'...`);
        const pool = new Pool({
            connectionString: dbUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
        });

        // 3. Read and Execute Schema
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`schema.sql not found at ${schemaPath}`);
        }

        console.log('Reading schema.sql...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await pool.query(schemaSql);

        console.log('✅ Schema applied successfully!');

        // 4. Verify tables
        const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);

        console.log('\nCreated Tables:');
        tables.rows.forEach(row => console.log(` - ${row.table_name}`));

        console.log('\n🎉 Setup Complete! You can now run "npm run dev".');
        await pool.end();

    } catch (err) {
        console.error('❌ Setup Failed:', err);
        process.exit(1);
    }
}

setupDatabase();
