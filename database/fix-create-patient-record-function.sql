-- ============================================================================
-- Fix create_patient_record function to return patient_id
-- ============================================================================
-- This updates the function to return the patient_id so we can use it immediately
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop and recreate the function to return patient_id
DROP FUNCTION IF EXISTS public.create_patient_record(UUID);

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

  -- Insert patient record and get the ID
  INSERT INTO public.patients (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
  RETURNING id INTO v_patient_id;

  -- If record already existed, fetch its ID
  IF v_patient_id IS NULL THEN
    SELECT id INTO v_patient_id
    FROM public.patients
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_patient_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_patient_record TO authenticated;

