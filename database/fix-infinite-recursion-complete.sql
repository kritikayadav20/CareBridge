-- ============================================================================
-- Fix Infinite Recursion in RLS Policies - Complete Fix
-- ============================================================================
-- The issue is caused by circular references in RLS policies
-- This script fixes ALL policies to avoid recursion
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX PATIENTS TABLE POLICIES
-- ============================================================================

-- Drop all existing policies on patients
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patient data for assigned transfers" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient data during active transfers" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own patient record" ON public.patients;

-- Recreate with simplified, non-recursive checks

-- Policy 1: Patients can view their own data (direct check, no nested EXISTS)
CREATE POLICY "Patients can view their own data"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Hospitals can view patient data for assigned transfers
CREATE POLICY "Hospitals can view patient data for assigned transfers"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = patients.id
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
      AND transfers.status IN ('accepted', 'completed')
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() 
      AND users.role = 'hospital'
    )
  );

-- Policy 3: Doctors can view patient data during active transfers
CREATE POLICY "Doctors can view patient data during active transfers"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = patients.id
      AND transfers.status IN ('accepted', 'completed')
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() 
      AND users.role = 'doctor'
    )
  );

-- Policy 4: Patients can insert their own patient record (simplified)
CREATE POLICY "Patients can insert their own patient record"
  ON public.patients FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'patient'
    )
  );

-- Policy 5: Patients can update their own patient record
CREATE POLICY "Patients can update their own patient record"
  ON public.patients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. FIX HEALTH_RECORDS TABLE POLICIES
-- ============================================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Patients can insert their own health records" ON public.health_records;

-- Recreate with simplified check (avoid nested EXISTS on patients)
CREATE POLICY "Patients can insert their own health records"
  ON public.health_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = health_records.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. VERIFY POLICIES
-- ============================================================================

-- Check patients policies
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'health_records')
ORDER BY tablename, policyname;

