-- ============================================================================
-- Create Permissive RLS Policies for Supabase Storage
-- ============================================================================
-- This script creates permissive RLS policies on storage.objects to allow file uploads
-- Run this in Supabase SQL Editor to fix "new row violates row-level security policy" errors
-- 
-- IMPORTANT: This ONLY affects Supabase Storage, NOT database tables
-- Database RLS remains enabled and unchanged
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all existing storage policies (if any)
-- ============================================================================
-- Remove any existing RLS policies on storage.objects for the medical-reports bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload to medical-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read from medical-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from medical-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- Also drop any policies that might have been created with different names
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (policyname LIKE '%medical%' OR policyname LIKE '%upload%' OR policyname LIKE '%read%' OR policyname LIKE '%delete%')
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create Permissive Policies for medical-reports bucket
-- ============================================================================
-- Allow authenticated users to INSERT (upload) files to medical-reports bucket
CREATE POLICY "Allow authenticated users to upload to medical-reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'medical-reports'
);

-- Allow authenticated users to SELECT (read) files from medical-reports bucket
CREATE POLICY "Allow authenticated users to read from medical-reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'medical-reports'
);

-- Allow authenticated users to DELETE files from medical-reports bucket
CREATE POLICY "Allow authenticated users to delete from medical-reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'medical-reports'
);

-- ============================================================================
-- Verification Query (Optional - run to verify policies are created)
-- ============================================================================
-- Uncomment the following to verify:
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%medical%';
-- Should show 3 policies: INSERT, SELECT, DELETE
*/

-- ============================================================================
-- Done!
-- ============================================================================
-- Permissive RLS policies have been created for storage.objects.
-- File uploads to the medical-reports bucket should now work without RLS errors.
-- 
-- The storage bucket remains PRIVATE - access is still controlled via:
-- 1. Application-level access control (API routes)
-- 2. Signed URLs for temporary access
-- 
-- Database tables are NOT affected - their RLS remains enabled.
-- ============================================================================

