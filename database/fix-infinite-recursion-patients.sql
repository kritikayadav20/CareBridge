-- ============================================================================
-- Fix Infinite Recursion in Patients RLS Policies
-- ============================================================================
-- The issue is likely caused by circular references in RLS policies
-- This script fixes the policies to avoid recursion
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, drop all existing policies on patients table
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patient data for assigned transfers" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient data during active transfers" ON public.patients;
DROP POLICY IF EXISTS "Patients can insert their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own patient record" ON public.patients;

-- Recreate SELECT policies with simpler, non-recursive checks
-- Policy 1: Patients can view their own data (simplified to avoid recursion)
CREATE POLICY "Patients can view their own data"
  ON public.patients FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Policy 2: Hospitals can view patient data for assigned transfers
-- Use a simpler check that doesn't recursively check patients
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

-- Now fix the health_records INSERT policy to avoid recursion
DROP POLICY IF EXISTS "Patients can insert their own health records" ON public.health_records;

CREATE POLICY "Patients can insert their own health records"
  ON public.health_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = health_records.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'patients'
ORDER BY policyname;

