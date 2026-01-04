-- ============================================================================
-- Disable Row Level Security (RLS) on All Tables
-- ============================================================================
-- This script removes all RLS policies and disables RLS on all tables
-- Run this in Supabase SQL Editor to resolve RLS errors
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL RLS Policies (Comprehensive)
-- ============================================================================
-- This section drops all known policies and also uses a catch-all to remove
-- any policies that might have been created dynamically

-- Drop all policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert all profiles" ON public.users;
DROP POLICY IF EXISTS "Hospitals can view patients admitted to them" ON public.users;
DROP POLICY IF EXISTS "Hospitals can admit patients" ON public.users;
DROP POLICY IF EXISTS "Doctors can view patients at their hospital" ON public.users;

-- Drop all policies on patients table
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patient data for assigned transfers" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient data during active transfers" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patients admitted to them" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can admit patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patients at their hospital" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can update patient data" ON public.patients;

-- Drop all policies on health_records table
DROP POLICY IF EXISTS "Patients can view their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Hospitals can view health records for assigned transfers" ON public.health_records;
DROP POLICY IF EXISTS "Doctors can view health records during active transfers" ON public.health_records;
DROP POLICY IF EXISTS "Patients can insert their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Patients can update their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Patients can delete their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Doctors can view health records at their hospital" ON public.health_records;
DROP POLICY IF EXISTS "Doctors can update health records at their hospital" ON public.health_records;
DROP POLICY IF EXISTS "Hospitals can view health records for admitted patients" ON public.health_records;

-- Drop all policies on transfers table
DROP POLICY IF EXISTS "Users can view transfers they are involved in" ON public.transfers;
DROP POLICY IF EXISTS "Hospitals can create transfer requests" ON public.transfers;
DROP POLICY IF EXISTS "Receiving hospitals can accept transfers" ON public.transfers;
DROP POLICY IF EXISTS "Hospitals can update their own transfers" ON public.transfers;
DROP POLICY IF EXISTS "Patients can view their own transfers" ON public.transfers;
DROP POLICY IF EXISTS "Doctors can view active transfers" ON public.transfers;

-- Drop all policies on medical_reports table
DROP POLICY IF EXISTS "Patients can view their own reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Hospitals can view reports for assigned transfers" ON public.medical_reports;
DROP POLICY IF EXISTS "Doctors can view reports during active transfers" ON public.medical_reports;
DROP POLICY IF EXISTS "Patients can insert their own reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Hospitals can view reports for admitted patients" ON public.medical_reports;
DROP POLICY IF EXISTS "Doctors can view reports at their hospital" ON public.medical_reports;

-- Drop all policies on messages table
DROP POLICY IF EXISTS "Users can view messages for transfers they are involved in" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for transfers they are involved in" ON public.messages;
DROP POLICY IF EXISTS "Hospitals can view messages for their transfers" ON public.messages;
DROP POLICY IF EXISTS "Doctors can view messages for active transfers" ON public.messages;

-- ============================================================================
-- Catch-all: Drop any remaining policies on all tables
-- ============================================================================
-- This ensures we catch any policies that might have been created but not listed above
DO $$ 
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY['users', 'patients', 'health_records', 'transfers', 'medical_reports', 'messages'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = table_name
        ) 
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, table_name);
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Disable RLS on All Tables
-- ============================================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification Query (Optional - run to verify RLS is disabled)
-- ============================================================================
-- Uncomment the following to verify RLS is disabled:
/*
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'patients', 'health_records', 'transfers', 'medical_reports', 'messages')
ORDER BY tablename;
-- All rowsecurity values should be 'f' (false)
*/

-- ============================================================================
-- Done!
-- ============================================================================
-- RLS has been disabled on all tables. All authenticated users can now
-- access all data without RLS restrictions.
-- 
-- WARNING: This removes all security restrictions. Make sure your application
-- handles access control at the application level if needed.
-- ============================================================================

