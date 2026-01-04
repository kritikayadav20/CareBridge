-- ============================================================================
-- Fix Patients SELECT Policy
-- ============================================================================
-- Ensure patients can view their own record
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;

-- Recreate with direct check (no nested queries)
CREATE POLICY "Patients can view their own data"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

-- Verify the policy was created
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'patients'
AND policyname = 'Patients can view their own data';

