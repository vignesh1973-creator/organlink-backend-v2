-- Enhancement Updates: Policy Withdrawal, Notification Read State, and Improvements
-- Created: 2025-01-25
-- Purpose: Add policy withdrawal features and fix notification read state persistence

-- 1. Add policy withdrawal and suspension columns
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS is_withdrawn BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

-- 2. Create index for active policies (excluding withdrawn/suspended)
CREATE INDEX IF NOT EXISTS idx_policies_active ON policies(status, is_withdrawn, is_suspended) 
WHERE is_withdrawn = FALSE AND is_suspended = FALSE;

-- 3. Add index for notification read state by user/hospital/organization
CREATE INDEX IF NOT EXISTS idx_notifications_hospital_read ON notifications(hospital_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON notifications(organization_id, is_read, created_at);

-- 4. Add status lifecycle tracking for patients and donors
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE donors
ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- 5. Add metadata to organ_requests for better tracking
ALTER TABLE organ_requests
ADD COLUMN IF NOT EXISTS request_metadata JSONB DEFAULT '{}'::jsonb;

-- 6. Create function to track status changes for patients
CREATE OR REPLACE FUNCTION track_patient_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.previous_status := OLD.status;
    NEW.status_history := COALESCE(NEW.status_history, '[]'::jsonb) || 
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'changed_at', NOW(),
        'changed_by', current_user
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to track status changes for donors
CREATE OR REPLACE FUNCTION track_donor_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.previous_status := OLD.status;
    NEW.status_history := COALESCE(NEW.status_history, '[]'::jsonb) || 
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'changed_at', NOW(),
        'changed_by', current_user
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for status tracking
DROP TRIGGER IF EXISTS patient_status_change_trigger ON patients;
CREATE TRIGGER patient_status_change_trigger
  BEFORE UPDATE ON patients
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_patient_status_change();

DROP TRIGGER IF EXISTS donor_status_change_trigger ON donors;
CREATE TRIGGER donor_status_change_trigger
  BEFORE UPDATE ON donors
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_donor_status_change();

-- 9. Add comment to track migration
COMMENT ON TABLE policies IS 'Updated with withdrawal and suspension features on 2025-01-25';
COMMENT ON TABLE notifications IS 'Indexed for better read state tracking on 2025-01-25';

-- 10. Log completion
DO $$
BEGIN
  RAISE NOTICE 'Enhancement updates completed successfully';
  RAISE NOTICE '- Policy withdrawal fields added';
  RAISE NOTICE '- Notification read state indexes created';
  RAISE NOTICE '- Patient/donor status tracking enabled';
END $$;
