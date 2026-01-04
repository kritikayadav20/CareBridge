-- ============================================================================
-- Create admit_patient Function
-- ============================================================================
-- This function allows hospitals to admit patients to their hospital
-- Run this in Supabase SQL Editor
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
-- Verification (Optional)
-- ============================================================================
-- Run this to verify the function was created:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name = 'admit_patient';
-- ============================================================================

