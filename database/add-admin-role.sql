-- ============================================================================
-- Add Admin Role and Create Admin Account
-- ============================================================================
-- Run this in Supabase SQL Editor to:
-- 1. Add 'admin' to the role enum
-- 2. Create the admin account
-- ============================================================================

-- Step 1: Update the users table to allow 'admin' role
-- First, drop the existing check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with 'admin' role
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('patient', 'doctor', 'hospital', 'admin'));

-- Step 2: Create admin account in auth.users
-- Note: This will create the auth user, you'll need to set the password via Supabase Dashboard
-- Or use the Supabase Admin API

-- Insert admin user into auth.users (requires service role or manual creation)
-- For security, we'll create a function that can be called with service role
CREATE OR REPLACE FUNCTION public.create_admin_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- This function should be called after creating the auth user manually
  -- or via Supabase Admin API
  
  -- Check if admin already exists (check by role, not email)
  IF EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN
    RAISE NOTICE 'Admin account already exists';
    RETURN;
  END IF;
  
  -- Note: auth.users entry must be created first via Supabase Dashboard or Admin API
  -- This function only creates the public.users entry
  RAISE NOTICE 'Please create admin user in auth.users first, then run the insert below';
END;
$$;

-- ============================================================================
-- MANUAL STEPS TO CREATE ADMIN ACCOUNT:
-- ============================================================================
-- 
-- Option 1: Via Supabase Dashboard (Recommended)
-- 1. Go to Authentication → Users → Add User
-- 2. Email: admin
-- 3. Password: admin123
-- 4. Auto Confirm User: Yes
-- 5. Copy the User ID
-- 6. Run the INSERT below with that User ID
--
-- Option 2: Via SQL (if you have service role access)
-- You'll need to use the Supabase Admin API or service role key
--
-- ============================================================================

-- After creating auth user, run this to create the profile:
-- Replace 'YOUR_ADMIN_USER_ID_HERE' with the actual UUID from auth.users

/*
INSERT INTO public.users (id, email, role, full_name, phone)
VALUES (
  'YOUR_ADMIN_USER_ID_HERE',  -- Replace with actual UUID
  'admin',
  'admin',
  'System Administrator',
  NULL
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', email = 'admin';
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check if admin role is allowed:
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_role_check';

-- Check if admin user exists:
SELECT id, email, role, full_name 
FROM public.users 
WHERE role = 'admin';

