-- ============================================================================
-- COMPLETE RLS FIX FOR SIGNUP - Run This in Supabase SQL Editor
-- ============================================================================
-- This fixes both "users" and "patients" table RLS errors during signup
-- Copy and paste this entire file into Supabase SQL Editor and run it
-- ============================================================================

-- ============================================================================
-- 1. FIX USERS TABLE
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create INSERT policy for users table
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create helper function for user profile creation (bypasses RLS)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- ============================================================================
-- 2. FIX PATIENTS TABLE
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;

-- Create INSERT policy for patients table
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_patient_record TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify)
-- ============================================================================

-- Check if functions were created
-- SELECT proname FROM pg_proc 
-- WHERE proname IN ('create_user_profile', 'create_patient_record');

-- Check if policies exist
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'patients')
-- ORDER BY tablename, policyname;

-- ============================================================================
-- DONE! Now try creating an account again.
-- ============================================================================

