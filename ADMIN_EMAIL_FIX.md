# Admin Account Email Fix

## Issue
Supabase requires email addresses to be in valid format (must include "@" symbol).

## Solution
Use a valid email format for the admin account.

## Updated Steps

### Step 1: Create Admin Account in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** or **"Invite User"**
3. Fill in:
   - **Email**: `admin@carebridge.com` ✅ (valid email format)
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ **Yes** (important!)
4. Click **"Create User"**
5. **Copy the User ID** (UUID) that appears

### Step 2: Create Admin Profile

Run this SQL in Supabase SQL Editor (replace `YOUR_USER_ID_HERE` with the UUID from Step 1):

```sql
SELECT public.create_admin_profile('YOUR_USER_ID_HERE');
```

Or insert directly:

```sql
INSERT INTO public.users (id, email, role, full_name, phone)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual UUID
  'admin@carebridge.com',  -- Use the same email as in auth.users
  'admin',
  'System Administrator',
  NULL
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', email = 'admin@carebridge.com', full_name = 'System Administrator';
```

### Step 3: Login

1. Go to http://localhost:3000/login
2. Login with:
   - **Email**: `admin@carebridge.com`
   - **Password**: `admin123`

## Alternative Email Options

You can use any valid email format:
- `admin@carebridge.com`
- `admin@example.com`
- `admin@yourdomain.com`
- `administrator@carebridge.com`

Just make sure:
- ✅ It includes "@" symbol
- ✅ It's a valid email format
- ✅ You use the same email in both `auth.users` and `public.users`

## Quick Reference

**Admin Login Credentials:**
- Email: `admin@carebridge.com` (or the email you used)
- Password: `admin123`

**Important:** The email in `public.users` must match the email in `auth.users` for the same user ID.

