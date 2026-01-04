-- ============================================================================
-- Fix RLS Policy for Patients Table During Signup
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the patients table RLS issue
-- ============================================================================

-- Add INSERT policy for patients table
CREATE POLICY IF NOT EXISTS "Patients can insert their own record"
  ON public.patients FOR INSERT
  WITH CHECK (
    -- Allow if the user_id matches the authenticated user
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() 
      AND users.id = patients.user_id
      AND users.role = 'patient'
    )
  );

-- Create helper function for patient record creation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_patient_record(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user exists and is a patient
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_user_id AND role = 'patient'
  ) THEN
    RAISE EXCEPTION 'User must be a patient to create patient record';
  END IF;

  -- Insert patient record
  INSERT INTO public.patients (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_patient_record TO authenticated;

