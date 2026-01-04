-- ============================================================================
-- Add Patient Admission Support
-- ============================================================================
-- This script adds the ability to track which hospital a patient is currently admitted to
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add current_hospital_id to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS current_hospital_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_current_hospital_id ON public.patients(current_hospital_id);

-- Add hospital_id to doctors (to track which hospital they belong to)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for doctor-hospital relationship
CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON public.users(hospital_id);

-- Update RLS policies to allow hospitals to view patients admitted to them
DROP POLICY IF EXISTS "Hospitals can view patients admitted to them" ON public.patients;

CREATE POLICY "Hospitals can view patients admitted to them"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    -- Hospital can view patients admitted to them
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'hospital'
      AND patients.current_hospital_id = auth.uid()
    )
  );

-- Update RLS policy to allow hospitals to update patient admission
DROP POLICY IF EXISTS "Hospitals can admit patients" ON public.patients;

CREATE POLICY "Hospitals can admit patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    -- Hospital can update current_hospital_id to their own ID (admit)
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'hospital'
    )
  )
  WITH CHECK (
    -- Can only set current_hospital_id to their own ID or NULL
    current_hospital_id = auth.uid() OR current_hospital_id IS NULL
  );

-- Update RLS policy for doctors to view patients at their hospital
DROP POLICY IF EXISTS "Doctors can view patients at their hospital" ON public.patients;

CREATE POLICY "Doctors can view patients at their hospital"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    -- Doctor can view patients admitted to their hospital
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'doctor'
      AND users.hospital_id = patients.current_hospital_id
    )
  );

-- Update health records RLS to allow doctors at hospital to view records
DROP POLICY IF EXISTS "Doctors can view health records at their hospital" ON public.health_records;

CREATE POLICY "Doctors can view health records at their hospital"
  ON public.health_records FOR SELECT
  TO authenticated
  USING (
    -- Doctor can view health records of patients at their hospital
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.patients ON patients.user_id = users.id
      WHERE users.id = auth.uid()
      AND users.role = 'doctor'
      AND users.hospital_id = patients.current_hospital_id
      AND patients.id = health_records.patient_id
    )
  );

-- Function to admit a patient (bypasses RLS for controlled admission)
CREATE OR REPLACE FUNCTION public.admit_patient(
  p_patient_id UUID,
  p_hospital_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hospital_role TEXT;
BEGIN
  -- Verify the caller is a hospital
  SELECT role INTO v_hospital_role
  FROM public.users
  WHERE id = auth.uid();
  
  IF v_hospital_role != 'hospital' THEN
    RAISE EXCEPTION 'Only hospitals can admit patients';
  END IF;
  
  -- Verify the hospital_id matches the caller
  IF p_hospital_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot admit patient to a different hospital';
  END IF;
  
  -- Update patient's current hospital
  UPDATE public.patients
  SET current_hospital_id = p_hospital_id
  WHERE id = p_patient_id;
  
  RETURN p_patient_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admit_patient TO authenticated;

