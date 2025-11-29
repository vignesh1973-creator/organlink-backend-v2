import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

console.log('Testing connection to:', connectionString?.split('@')[1]); // Log host only for safety

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    try {
        console.log('Connecting...');
        const client = await pool.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Server time:', res.rows[0].now);
        client.release();
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

testConnection();
