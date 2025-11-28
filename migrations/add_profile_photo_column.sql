-- Add profile_photo column to donors and patients tables
-- This will store extracted photos from Aadhaar cards (base64) or NULL for signature-only registrations

-- Add to donors table
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Add to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN donors.profile_photo IS 'Base64-encoded profile photo extracted from Aadhaar card during registration (NULL if signature-only verification)';
COMMENT ON COLUMN patients.profile_photo IS 'Base64-encoded profile photo extracted from Aadhaar card during registration (NULL if signature-only verification)';

-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('donors', 'patients') 
AND column_name = 'profile_photo';
