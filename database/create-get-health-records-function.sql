-- ============================================================================
-- Create Helper Function to Get Health Records by User ID
-- ============================================================================
-- This bypasses RLS and allows fetching health records directly
-- Run this in Supabase SQL Editor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_health_records_by_user_id(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  sugar_level DECIMAL,
  recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hr.id,
    hr.patient_id,
    hr.blood_pressure_systolic,
    hr.blood_pressure_diastolic,
    hr.heart_rate,
    hr.sugar_level,
    hr.recorded_at,
    hr.created_at
  FROM public.health_records hr
  INNER JOIN public.patients p ON p.id = hr.patient_id
  WHERE p.user_id = p_user_id
  ORDER BY hr.recorded_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_health_records_by_user_id(UUID) TO authenticated;

-- Verify function was created
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'get_health_records_by_user_id';

