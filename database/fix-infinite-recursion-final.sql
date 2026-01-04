-- ============================================================================
-- Fix Infinite Recursion - Final Solution
-- ============================================================================
-- Use a SECURITY DEFINER function to bypass RLS when checking patient ownership
-- This completely avoids the recursion issue
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE HELPER FUNCTION TO CHECK PATIENT OWNERSHIP (bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_patient_ownership(
  p_patient_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This function bypasses RLS, so it can check without recursion
  RETURN EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_patient_id
    AND user_id = p_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_patient_ownership(UUID, UUID) TO authenticated;

-- ============================================================================
-- 2. FIX PATIENTS TABLE POLICIES (simplified)
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patient data for assigned transfers" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient data during active transfers" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own patient record" ON public.patients;

-- Recreate with direct checks only (no nested queries that could cause recursion)
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

CREATE POLICY "Patients can insert their own patient record"
  ON public.patients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Patients can update their own patient record"
  ON public.patients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 3. FIX HEALTH_RECORDS INSERT POLICY (use function to avoid recursion)
-- ============================================================================

DROP POLICY IF EXISTS "Patients can insert their own health records" ON public.health_records;

-- Use the helper function which bypasses RLS
CREATE POLICY "Patients can insert their own health records"
  ON public.health_records FOR INSERT
  WITH CHECK (
    public.check_patient_ownership(health_records.patient_id, auth.uid())
  );

-- ============================================================================
-- 4. FIX HEALTH_RECORDS SELECT POLICIES (simplified)
-- ============================================================================

DROP POLICY IF EXISTS "Patients can view their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Hospitals can view health records for assigned transfers" ON public.health_records;
DROP POLICY IF EXISTS "Doctors can view health records during active transfers" ON public.health_records;

-- Use function for patient check
CREATE POLICY "Patients can view their own health records"
  ON public.health_records FOR SELECT
  USING (
    public.check_patient_ownership(health_records.patient_id, auth.uid())
  );

CREATE POLICY "Hospitals can view health records for assigned transfers"
  ON public.health_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = health_records.patient_id
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
      AND transfers.status IN ('accepted', 'completed')
    )
  );

CREATE POLICY "Doctors can view health records during active transfers"
  ON public.health_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = health_records.patient_id
      AND transfers.status IN ('accepted', 'completed')
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 5. VERIFY
-- ============================================================================

-- Check that function was created
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'check_patient_ownership';

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'health_records')
ORDER BY tablename, policyname;

