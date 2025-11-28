import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  try {
    console.log("🚀 Starting migration: Adding hospital_display_id...");

    // 1. Add column to patients
    console.log("Adding hospital_display_id to patients table...");
    await pool.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS hospital_display_id INTEGER;
    `);

    // 2. Backfill patients
    console.log("Backfilling patients data...");
    await pool.query(`
      WITH ranked_patients AS (
        SELECT patient_id, 
               ROW_NUMBER() OVER (PARTITION BY hospital_id ORDER BY created_at ASC) as new_id
        FROM patients
      )
      UPDATE patients p
      SET hospital_display_id = rp.new_id
      FROM ranked_patients rp
      WHERE p.patient_id = rp.patient_id
        AND p.hospital_display_id IS NULL;
    `);

    // 3. Add column to donors
    console.log("Adding hospital_display_id to donors table...");
    await pool.query(`
      ALTER TABLE donors 
      ADD COLUMN IF NOT EXISTS hospital_display_id INTEGER;
    `);

    // 4. Backfill donors
    console.log("Backfilling donors data...");
    await pool.query(`
      WITH ranked_donors AS (
        SELECT donor_id, 
               ROW_NUMBER() OVER (PARTITION BY hospital_id ORDER BY created_at ASC) as new_id
        FROM donors
      )
      UPDATE donors d
      SET hospital_display_id = rd.new_id
      FROM ranked_donors rd
      WHERE d.donor_id = rd.donor_id
        AND d.hospital_display_id IS NULL;
    `);

    console.log("✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
