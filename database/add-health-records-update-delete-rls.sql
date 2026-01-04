-- ============================================================================
-- Add UPDATE and DELETE RLS Policies for Health Records
-- ============================================================================
-- This script adds UPDATE and DELETE policies for health_records table
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Patients can update their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Patients can delete their own health records" ON public.health_records;

-- Patients can update their own health records
CREATE POLICY "Patients can update their own health records"
  ON public.health_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = health_records.patient_id
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.id = patients.user_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = health_records.patient_id
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.id = patients.user_id
      )
    )
  );

-- Patients can delete their own health records
CREATE POLICY "Patients can delete their own health records"
  ON public.health_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = health_records.patient_id
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.id = patients.user_id
      )
    )
  );

