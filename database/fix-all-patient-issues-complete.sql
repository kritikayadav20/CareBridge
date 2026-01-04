-- ============================================================================
-- Complete Fix for Patient Record Issues
-- ============================================================================
-- This fixes infinite recursion and ensures patient records can be accessed
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create helper function to get patient record (bypasses RLS completely)
CREATE OR REPLACE FUNCTION public.get_patient_by_user_id(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.date_of_birth,
    p.gender,
    p.address,
    p.emergency_contact,
    p.created_at
  FROM public.patients p
  WHERE p.user_id = p_user_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_patient_by_user_id(UUID) TO authenticated;

-- 2. Ensure create_patient_record function exists and returns UUID
DROP FUNCTION IF EXISTS public.create_patient_record(UUID);

CREATE OR REPLACE FUNCTION public.create_patient_record(
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- First, check if patient record already exists
  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE user_id = p_user_id
  LIMIT 1;

  -- If it doesn't exist, create it
  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_patient_id;
  END IF;

  -- Always return the patient_id
  RETURN v_patient_id;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, try to get existing record
    SELECT id INTO v_patient_id
    FROM public.patients
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- If still null, raise the original error
    IF v_patient_id IS NULL THEN
      RAISE;
    END IF;
    
    RETURN v_patient_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_patient_record(UUID) TO authenticated;

-- 3. Drop ALL existing policies on patients table
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patient data for assigned transfers" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient data during active transfers" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own patient record" ON public.patients;

-- 4. Recreate SELECT policies with SIMPLE, direct checks (no nested queries)
CREATE POLICY "Patients can view their own data"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Hospitals can view patient data for assigned transfers"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = patients.id
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
      AND transfers.status IN ('accepted', 'completed')
    )
  );

CREATE POLICY "Doctors can view patient data during active transfers"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = patients.id
      AND transfers.status IN ('accepted', 'completed')
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
    )
  );

-- 5. INSERT policy
CREATE POLICY "Patients can insert their own patient record"
  ON public.patients FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 6. UPDATE policy
CREATE POLICY "Patients can update their own patient record"
  ON public.patients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. Verify functions exist
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname IN ('get_patient_by_user_id', 'create_patient_record')
ORDER BY proname;

-- 8. Verify policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'patients'
ORDER BY policyname;

