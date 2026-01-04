-- ============================================================================
-- Setup Patient Admission System
-- ============================================================================
-- This script sets up the complete patient admission functionality:
-- 1. Adds required columns to patients and users tables
-- 2. Creates indexes for performance
-- 3. Creates the admit_patient function
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Columns
-- ============================================================================

-- Add current_hospital_id to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS current_hospital_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_current_hospital_id ON public.patients(current_hospital_id);

-- Add hospital_id to users table (for doctors to track which hospital they belong to)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for doctor-hospital relationship
CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON public.users(hospital_id);

-- ============================================================================
-- STEP 2: Create admit_patient Function
-- ============================================================================

-- Function to admit a patient
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
  v_patient_exists BOOLEAN;
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
  
  -- Verify patient exists
  SELECT EXISTS(SELECT 1 FROM public.patients WHERE id = p_patient_id) INTO v_patient_exists;
  
  IF NOT v_patient_exists THEN
    RAISE EXCEPTION 'Patient not found';
  END IF;
  
  -- Update patient's current hospital
  UPDATE public.patients
  SET current_hospital_id = p_hospital_id
  WHERE id = p_patient_id;
  
  -- Return the patient_id if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to admit patient';
  END IF;
  
  RETURN p_patient_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admit_patient(UUID, UUID) TO authenticated;

-- ============================================================================
-- Done!
-- ============================================================================
-- The patient admission system is now set up. Hospitals can now:
-- 1. Search for patients by email or patient ID
-- 2. Admit patients to their hospital using the admit_patient function
-- ============================================================================

