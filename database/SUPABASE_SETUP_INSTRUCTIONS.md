# Supabase Setup Instructions for CareBridge

## Quick Setup Guide

### Step 1: Run the SQL File

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `database/supabase-setup.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify all tables, policies, and indexes are created successfully

### Step 2: Create Storage Bucket

Storage buckets cannot be created via SQL. You must use the Supabase Dashboard:

1. Go to **Storage** in your Supabase dashboard
2. Click **Create Bucket**
3. Enter bucket name: `medical-reports`
4. **IMPORTANT**: Make sure it's set to **PRIVATE** (not public)
5. Click **Create bucket**

The storage policies in the SQL file will automatically apply once the bucket exists.

### Step 3: Enable Realtime (Optional - for chat feature)

If you want real-time chat functionality:

1. Go to **SQL Editor** again
2. Run this command:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
   ```

### Step 4: Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## What the SQL File Creates

### Tables
- ✅ `users` - User profiles with roles
- ✅ `patients` - Patient-specific information
- ✅ `health_records` - Time-series health data
- ✅ `transfers` - Patient transfer requests
- ✅ `medical_reports` - Medical report metadata
- ✅ `messages` - Real-time chat messages

### Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Comprehensive RLS policies for all user roles
- ✅ Storage bucket policies for file access control

### Performance
- ✅ Indexes on frequently queried columns
- ✅ Foreign key constraints for data integrity

## Troubleshooting

### "Policy already exists" errors
The SQL file includes `DROP POLICY IF EXISTS` statements, so you can safely re-run it.

### Storage policies not working
1. Verify the bucket name is exactly `medical-reports`
2. Ensure the bucket is set to PRIVATE
3. Check that the storage policies were created:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'storage';
   ```

### Realtime not working
1. Verify Realtime is enabled for the messages table:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
2. If messages table is not listed, run:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
   ```

### Foreign key errors
Make sure you run the SQL file in order. The file is structured to create tables before adding foreign key constraints.

## Testing the Setup

1. **Create a test user** via the application signup page
2. **Verify user profile** was created in `public.users` table
3. **If patient**, verify `public.patients` record was created
4. **Test RLS** by trying to access data as different users

## Next Steps

After running the SQL file:
1. ✅ Create the storage bucket (see Step 2 above)
2. ✅ Enable Realtime if needed (see Step 3 above)
3. ✅ Configure your `.env.local` with Supabase credentials
4. ✅ Start the Next.js application: `npm run dev`

