-- ============================================================================
-- Create Patient Record Function - Version 2 (Guaranteed to work)
-- ============================================================================
-- This function creates or gets patient record and returns the ID
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing function (if any)
DROP FUNCTION IF EXISTS public.create_patient_record(UUID);

-- Create the function that returns UUID
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
  -- First, check if patient record already exists
  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE user_id = p_user_id
  LIMIT 1;

  -- If it doesn't exist, create it
  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_patient_id;
  END IF;

  -- Always return the patient_id
  RETURN v_patient_id;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, try to get existing record
    SELECT id INTO v_patient_id
    FROM public.patients
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- If still null, raise the original error
    IF v_patient_id IS NULL THEN
      RAISE;
    END IF;
    
    RETURN v_patient_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_patient_record(UUID) TO authenticated;

-- Verify it was created
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_patient_record';

