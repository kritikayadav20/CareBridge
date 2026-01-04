-- ============================================================================
-- CREATE ADMIN ACCOUNT - Complete Script
-- ============================================================================
-- This script helps you create the admin account
-- Run the parts that apply to your setup
-- ============================================================================

-- Step 1: Ensure admin role is allowed in users table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('patient', 'doctor', 'hospital', 'admin'));

-- Step 2: Create admin user profile function
CREATE OR REPLACE FUNCTION public.create_admin_profile(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  -- Get the email from auth.users
  SELECT email INTO v_admin_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- If email not found, use default
  IF v_admin_email IS NULL THEN
    v_admin_email := 'admin@carebridge.com';
  END IF;
  
  INSERT INTO public.users (id, email, role, full_name, phone)
  VALUES (p_user_id, v_admin_email, 'admin', 'System Administrator', NULL)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', email = v_admin_email, full_name = 'System Administrator';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_profile TO authenticated;

-- ============================================================================
-- INSTRUCTIONS TO CREATE ADMIN ACCOUNT:
-- ============================================================================
-- 
-- METHOD 1: Via Supabase Dashboard (Easiest)
-- 
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" or "Invite User"
-- 3. Fill in:
--    - Email: admin@carebridge.com (must be valid email format with @)
--    - Password: admin123
--    - Auto Confirm User: ✅ Yes
-- 4. Click "Create User"
-- 5. Copy the User ID (UUID) that appears
-- 6. Come back to SQL Editor and run:
--
--    SELECT public.create_admin_profile('PASTE_USER_ID_HERE');
--
-- METHOD 2: Via Supabase CLI (if you have it)
--
-- supabase auth users create admin --password admin123 --email admin
-- Then get the user ID and run the function above
--
-- ============================================================================

-- After creating auth user, run this (replace USER_ID):
-- SELECT public.create_admin_profile('YOUR_USER_ID_HERE');

-- Verify admin was created:
SELECT id, email, role, full_name, created_at 
FROM public.users 
WHERE role = 'admin';

