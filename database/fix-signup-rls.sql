-- ============================================================================
-- Fix for RLS Policy Issues During Signup
-- ============================================================================
-- This SQL fixes the "new row violates row-level security policy" errors
-- when creating a new account (for both users and patients tables).
-- ============================================================================
-- Run this in Supabase SQL Editor after running the main schema
-- ============================================================================

-- Create a function to handle user profile creation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by a trigger when a new user signs up
  -- For now, we'll modify the RLS policy to be more permissive during signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Make the INSERT policy more permissive
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create a more permissive INSERT policy that allows users to insert their own profile
-- This works because auth.uid() is available immediately after signup
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    -- Allow if the user is inserting their own profile (id matches auth.uid())
    auth.uid() = id
    -- OR if the user was just created (for cases where session isn't immediately available)
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = public.users.id
      AND auth.users.created_at > NOW() - INTERVAL '1 minute'
    )
  );

-- ============================================================================
-- ALTERNATIVE SOLUTION: Use a Service Role Function
-- ============================================================================
-- If the above doesn't work, create a function that uses service role privileges
-- This requires the function to be called from a server-side API route

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- ============================================================================
-- FIX FOR PATIENTS TABLE
-- ============================================================================

-- Add INSERT policy for patients table
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

-- ============================================================================
-- RECOMMENDED: Update the signup API route to use these functions
-- ============================================================================
-- The API route should call: 
-- - SELECT public.create_user_profile(...) for user profile
-- - SELECT public.create_patient_record(...) for patient record
-- These will bypass RLS because they're SECURITY DEFINER

