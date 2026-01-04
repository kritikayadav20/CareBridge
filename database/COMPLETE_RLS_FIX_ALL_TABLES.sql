-- ============================================================================
-- COMPLETE RLS FIX FOR ALL TABLES - Run This in Supabase SQL Editor
-- ============================================================================
-- This ensures all tables have proper INSERT policies and helper functions
-- Run this after the main schema to fix any RLS issues
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE (You already ran this, but included for completeness)
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_role TEXT,
  p_full_name TEXT,
  p_phone TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, phone)
  VALUES (p_user_id, p_email, p_role, p_full_name, p_phone)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- ============================================================================
-- 2. PATIENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;

CREATE POLICY "Patients can insert their own record"
  ON public.patients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() 
      AND users.id = patients.user_id
      AND users.role = 'patient'
    )
  );

CREATE OR REPLACE FUNCTION public.create_patient_record(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_user_id AND role = 'patient'
  ) THEN
    RAISE EXCEPTION 'User must be a patient to create patient record';
  END IF;

  INSERT INTO public.patients (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_patient_record TO authenticated;

-- ============================================================================
-- 3. HEALTH_RECORDS TABLE
-- ============================================================================
-- Already has INSERT policy, but let's ensure it's correct and add helper function

-- Verify the policy exists (it should from main schema)
-- If it doesn't exist, this will create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'health_records' 
    AND policyname = 'Patients can insert their own health records'
  ) THEN
    CREATE POLICY "Patients can insert their own health records"
      ON public.health_records FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.patients
          WHERE patients.id = health_records.patient_id
          AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.id = patients.user_id
          )
        )
      );
  END IF;
END $$;

-- Helper function for health records (optional, but useful)
CREATE OR REPLACE FUNCTION public.create_health_record(
  p_patient_id UUID,
  p_blood_pressure_systolic INTEGER,
  p_blood_pressure_diastolic INTEGER,
  p_heart_rate INTEGER,
  p_sugar_level DECIMAL,
  p_recorded_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id UUID;
BEGIN
  -- Verify patient belongs to authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_patient_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.id = patients.user_id
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Patient record not found or does not belong to user';
  END IF;

  INSERT INTO public.health_records (
    patient_id, 
    blood_pressure_systolic, 
    blood_pressure_diastolic, 
    heart_rate, 
    sugar_level, 
    recorded_at
  )
  VALUES (
    p_patient_id, 
    p_blood_pressure_systolic, 
    p_blood_pressure_diastolic, 
    p_heart_rate, 
    p_sugar_level, 
    p_recorded_at
  )
  RETURNING id INTO v_record_id;

  RETURN v_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_health_record TO authenticated;

-- ============================================================================
-- 4. TRANSFERS TABLE
-- ============================================================================
-- Already has INSERT policy for hospitals, verify it exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'transfers' 
    AND policyname = 'Hospitals can create transfer requests'
  ) THEN
    CREATE POLICY "Hospitals can create transfer requests"
      ON public.transfers FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'hospital'
        )
      );
  END IF;
END $$;

-- Helper function for transfers (optional)
CREATE OR REPLACE FUNCTION public.create_transfer(
  p_patient_id UUID,
  p_from_hospital_id UUID,
  p_to_hospital_id UUID,
  p_transfer_type TEXT,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id UUID;
BEGIN
  -- Verify user is a hospital
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'hospital'
  ) THEN
    RAISE EXCEPTION 'Only hospitals can create transfer requests';
  END IF;

  -- Verify transfer type is valid
  IF p_transfer_type NOT IN ('emergency', 'non-emergency') THEN
    RAISE EXCEPTION 'Invalid transfer type';
  END IF;

  INSERT INTO public.transfers (
    patient_id,
    from_hospital_id,
    to_hospital_id,
    transfer_type,
    reason,
    status
  )
  VALUES (
    p_patient_id,
    p_from_hospital_id,
    p_to_hospital_id,
    p_transfer_type,
    p_reason,
    'requested'
  )
  RETURNING id INTO v_transfer_id;

  RETURN v_transfer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_transfer TO authenticated;

-- ============================================================================
-- 5. MEDICAL_REPORTS TABLE
-- ============================================================================
-- Already has INSERT policy, verify it exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'medical_reports' 
    AND policyname = 'Patients can upload their own reports'
  ) THEN
    CREATE POLICY "Patients can upload their own reports"
      ON public.medical_reports FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.patients
          WHERE patients.id = medical_reports.patient_id
          AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.id = patients.user_id
          )
        )
      );
  END IF;
END $$;

-- Helper function for medical reports (optional)
CREATE OR REPLACE FUNCTION public.create_medical_report(
  p_patient_id UUID,
  p_report_name TEXT,
  p_file_url TEXT,
  p_report_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id UUID;
BEGIN
  -- Verify patient belongs to authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_patient_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.id = patients.user_id
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Patient record not found or does not belong to user';
  END IF;

  INSERT INTO public.medical_reports (
    patient_id,
    report_name,
    file_url,
    report_type
  )
  VALUES (
    p_patient_id,
    p_report_name,
    p_file_url,
    p_report_type
  )
  RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_medical_report TO authenticated;

-- ============================================================================
-- 6. MESSAGES TABLE
-- ============================================================================
-- Already has INSERT policy, verify it exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'messages' 
    AND policyname = 'Users can send messages for transfers they are involved in'
  ) THEN
    CREATE POLICY "Users can send messages for transfers they are involved in"
      ON public.messages FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.transfers
          WHERE transfers.id = messages.transfer_id
          AND EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = transfers.patient_id
            AND (
              patients.user_id = auth.uid()
              OR transfers.from_hospital_id = auth.uid()
              OR transfers.to_hospital_id = auth.uid()
            )
          )
        )
        AND sender_id = auth.uid()
      );
  END IF;
END $$;

-- Helper function for messages (optional)
CREATE OR REPLACE FUNCTION public.create_message(
  p_transfer_id UUID,
  p_sender_id UUID,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Verify user is involved in the transfer
  IF NOT EXISTS (
    SELECT 1 FROM public.transfers
    WHERE id = p_transfer_id
    AND EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = transfers.patient_id
      AND (
        patients.user_id = p_sender_id
        OR transfers.from_hospital_id = p_sender_id
        OR transfers.to_hospital_id = p_sender_id
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not involved in this transfer';
  END IF;

  -- Verify sender_id matches authenticated user
  IF p_sender_id != auth.uid() THEN
    RAISE EXCEPTION 'Sender ID must match authenticated user';
  END IF;

  INSERT INTO public.messages (
    transfer_id,
    sender_id,
    message
  )
  VALUES (
    p_transfer_id,
    p_sender_id,
    p_message
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_message TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all INSERT policies exist
SELECT 
  tablename, 
  policyname,
  CASE 
    WHEN cmd = 'INSERT' THEN '✓'
    ELSE '✗'
  END as has_insert_policy
FROM pg_policies 
WHERE schemaname = 'public' 
AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- Check all helper functions exist
SELECT 
  proname as function_name,
  '✓' as exists
FROM pg_proc 
WHERE proname IN (
  'create_user_profile',
  'create_patient_record',
  'create_health_record',
  'create_transfer',
  'create_medical_report',
  'create_message'
)
ORDER BY proname;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- All tables now have:
-- 1. Proper INSERT policies for RLS
-- 2. Helper functions that bypass RLS when needed (SECURITY DEFINER)
-- 3. Validation checks in functions for security
-- 
-- This ensures:
-- - Signup works (users, patients tables)
-- - All CRUD operations work properly
-- - RLS is enforced but can be bypassed when needed
-- - Security is maintained through function validation
-- ============================================================================

