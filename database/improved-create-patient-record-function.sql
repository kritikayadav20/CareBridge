-- ============================================================================
-- Improved create_patient_record function
-- ============================================================================
-- This version is more robust and always returns the patient_id
-- Run this in Supabase SQL Editor to update the function
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_patient_record(UUID);

-- Create improved function that always returns patient_id
CREATE OR REPLACE FUNCTION public.create_patient_record(
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Verify the user exists and is a patient
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_user_id AND role = 'patient'
  ) THEN
    RAISE EXCEPTION 'User must be a patient to create patient record';
  END IF;

  -- Try to get existing patient record first
  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE user_id = p_user_id
  LIMIT 1;

  -- If no record exists, create it
  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_patient_id;
  END IF;

  -- Return the patient_id (either existing or newly created)
  RETURN v_patient_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_patient_record(UUID) TO authenticated;

-- Verify the function was created
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_patient_record';

