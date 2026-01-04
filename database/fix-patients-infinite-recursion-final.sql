-- ============================================================================
-- Fix Infinite Recursion in Patients Table - Final Solution
-- ============================================================================
-- Use SECURITY DEFINER function to completely bypass RLS for patient checks
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create helper function to get patient record (bypasses RLS)
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

-- 2. Drop ALL existing policies on patients table
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patient data for assigned transfers" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient data during active transfers" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own patient record" ON public.patients;

-- 3. Recreate SELECT policies with NO nested queries
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

-- 4. INSERT policy
CREATE POLICY "Patients can insert their own patient record"
  ON public.patients FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. UPDATE policy
CREATE POLICY "Patients can update their own patient record"
  ON public.patients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Verify policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'patients'
ORDER BY policyname;

