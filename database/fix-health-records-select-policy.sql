-- ============================================================================
-- Fix Health Records SELECT Policy
-- ============================================================================
-- Ensure the SELECT policy is working correctly using the helper function
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, make sure the helper function exists
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

-- Drop and recreate the SELECT policy
DROP POLICY IF EXISTS "Patients can view their own health records" ON public.health_records;

-- Create the SELECT policy using the helper function
CREATE POLICY "Patients can view their own health records"
  ON public.health_records FOR SELECT
  USING (
    public.check_patient_ownership(health_records.patient_id, auth.uid())
  );

-- Verify the policy was created
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'health_records'
AND policyname = 'Patients can view their own health records';

-- Test the function (replace with actual values to test)
-- SELECT public.check_patient_ownership('PATIENT_ID_HERE', 'USER_ID_HERE');

