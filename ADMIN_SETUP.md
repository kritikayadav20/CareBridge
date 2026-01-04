# Admin Account Setup Guide

## Overview
Doctor accounts can only be created by administrators. This guide shows you how to set up the admin account and create doctor accounts.

## Step 1: Add Admin Role to Database

Run this SQL in Supabase SQL Editor:

```sql
-- Allow 'admin' role in users table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('patient', 'doctor', 'hospital', 'admin'));

-- Create helper function for admin profile
CREATE OR REPLACE FUNCTION public.create_admin_profile(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, phone)
  VALUES (p_user_id, 'admin', 'admin', 'System Administrator', NULL)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', email = 'admin', full_name = 'System Administrator';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_profile TO authenticated;
```

## Step 2: Create Admin Account in Supabase

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** or **"Invite User"**
3. Fill in:
   - **Email**: `admin@carebridge.com` (or `admin@example.com` - must be valid email format)
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ **Yes** (important!)
4. Click **"Create User"**
5. **Copy the User ID** (UUID) that appears

### Method 2: Via Supabase CLI (if available)

```bash
supabase auth users create admin --password admin123 --email admin
```

## Step 3: Create Admin Profile

After creating the auth user, run this SQL (replace `YOUR_USER_ID_HERE` with the UUID from Step 2):

```sql
SELECT public.create_admin_profile('YOUR_USER_ID_HERE');
```

Or insert directly:

```sql
INSERT INTO public.users (id, email, role, full_name, phone)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual UUID
  'admin',
  'admin',
  'System Administrator',
  NULL
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', email = 'admin', full_name = 'System Administrator';
```

## Step 4: Verify Admin Account

1. Go to http://localhost:3000/login
2. Login with:
   - **Email**: `admin@carebridge.com` (or whatever email you used)
   - **Password**: `admin123`
3. You should see the admin dashboard with "Create Doctor/Hospital Accounts" option

## Step 5: Create Doctor Accounts

1. Login as admin
2. Go to **Dashboard** → **Create Doctor/Hospital Accounts**
3. Fill in the form:
   - Select **Doctor** or **Hospital**
   - Enter full name, email, password
   - Click **Create Account**
4. The account will be created and the doctor/hospital can login immediately

## Security Notes

- ✅ Admin accounts cannot be created via public signup
- ✅ Doctor accounts can only be created by admins
- ✅ Hospital accounts can still be created via public signup (or by admin)
- ✅ Patient accounts can be created via public signup
- ✅ All account creation is logged and validated

## Quick Reference

**Admin Login:**
- Email: `admin@carebridge.com` (or the email you used during setup)
- Password: `admin123`

**Admin Panel:**
- URL: `/dashboard/admin`
- Access: Admin role only

**API Endpoint:**
- `/api/admin/create-account`
- Requires admin authentication
- Creates doctor or hospital accounts

## Troubleshooting

### "Admin account not found"
- Verify the user exists in `auth.users`
- Verify the profile exists in `public.users` with role='admin'
- Check the User ID matches in both tables

### "Forbidden: Admin access required"
- Verify you're logged in as admin
- Check your role in `public.users` table
- Try logging out and back in

### "Doctor accounts can only be created by administrators"
- This is expected - doctor signup is blocked on public signup page
- Use admin panel to create doctor accounts

## Files Modified

1. `database/add-admin-role.sql` - Adds admin role support
2. `database/create-admin-account.sql` - Helper script for admin creation
3. `app/(auth)/signup/page.tsx` - Removed doctor option from signup
4. `app/api/auth/signup/route.ts` - Blocks doctor/admin signup
5. `app/api/admin/create-account/route.ts` - Admin-only account creation
6. `app/dashboard/admin/page.tsx` - Admin panel UI
7. `types/index.ts` - Added 'admin' to UserRole type
8. `lib/auth.ts` - Added `requireAdmin()` helper

All set! 🎉

