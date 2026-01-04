# Disable Row Level Security (RLS) - Instructions

## Overview
This guide will help you disable Row Level Security (RLS) on all tables in your Supabase database to resolve RLS errors.

## Why Disable RLS?
RLS can cause errors when policies are complex or have circular dependencies. Disabling RLS removes all row-level security restrictions, allowing all authenticated users to access all data.

**⚠️ WARNING**: Disabling RLS removes database-level security. Make sure your application handles access control at the application level if needed.

## Steps to Disable RLS

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Disable RLS Script
1. Open the file: `database/disable-rls-all-tables.sql`
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Verify RLS is Disabled (Optional)
Run this query to verify RLS is disabled on all tables:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'patients', 'health_records', 'transfers', 'medical_reports', 'messages')
ORDER BY tablename;
```

All `rowsecurity` values should be `f` (false).

## What This Script Does

1. **Drops All RLS Policies**: Removes all existing RLS policies from all tables
2. **Disables RLS**: Turns off Row Level Security on all tables:
   - `users`
   - `patients`
   - `health_records`
   - `transfers`
   - `medical_reports`
   - `messages`

## After Disabling RLS

- ✅ All authenticated users can now access all data
- ✅ No more RLS policy errors
- ✅ All database operations should work without RLS restrictions

## Re-enabling RLS (If Needed Later)

If you want to re-enable RLS later, you'll need to:
1. Re-run your original setup script (`database/supabase-setup.sql`)
2. Or create new, simpler RLS policies

## Notes

- This change is **permanent** until you re-enable RLS
- All existing data remains intact
- Application-level authentication still works (users must be logged in)
- This only affects database-level row security

## Troubleshooting

If you still see RLS errors after running the script:
1. Make sure you ran the script in the correct Supabase project
2. Check that all tables exist (some might have been created later)
3. Try running the script again (it's idempotent - safe to run multiple times)

