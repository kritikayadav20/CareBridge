-- ============================================================================
-- Improve admit_patient Function with Better Error Handling
-- ============================================================================
-- This is an improved version of the admit_patient function with better
-- error handling and verification
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop and recreate the function with improved error handling
DROP FUNCTION IF EXISTS public.admit_patient(UUID, UUID);

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
  v_updated_count INTEGER;
BEGIN
  -- Verify the caller is a hospital
  SELECT role INTO v_hospital_role
  FROM public.users
  WHERE id = auth.uid();
  
  IF v_hospital_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_hospital_role != 'hospital' THEN
    RAISE EXCEPTION 'Only hospitals can admit patients. Current role: %', v_hospital_role;
  END IF;
  
  -- Verify the hospital_id matches the caller
  IF p_hospital_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot admit patient to a different hospital';
  END IF;
  
  -- Verify patient exists
  SELECT EXISTS(SELECT 1 FROM public.patients WHERE id = p_patient_id) INTO v_patient_exists;
  
  IF NOT v_patient_exists THEN
    RAISE EXCEPTION 'Patient not found with ID: %', p_patient_id;
  END IF;
  
  -- Update patient's current hospital
  UPDATE public.patients
  SET current_hospital_id = p_hospital_id
  WHERE id = p_patient_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Verify the update was successful
  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'Failed to update patient record. No rows were updated.';
  END IF;
  
  -- Double-check the update worked
  IF NOT EXISTS(SELECT 1 FROM public.patients WHERE id = p_patient_id AND current_hospital_id = p_hospital_id) THEN
    RAISE EXCEPTION 'Update appeared to succeed but verification failed';
  END IF;
  
  RETURN p_patient_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admit_patient(UUID, UUID) TO authenticated;

-- ============================================================================
-- Verification Query (Optional - run to test)
-- ============================================================================
-- Test the function (replace with actual IDs):
-- SELECT public.admit_patient('patient-uuid-here', 'hospital-uuid-here');
-- ============================================================================

