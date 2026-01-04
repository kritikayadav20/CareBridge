-- ============================================================================
-- Verify Patient Record RLS and Fix if Needed
-- ============================================================================
-- Run this to check and fix patient record creation issues
-- ============================================================================

-- 1. Check if INSERT policy exists for patients table
SELECT 
  tablename, 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'patients'
AND cmd = 'INSERT';

-- 2. If policy doesn't exist or is wrong, recreate it
DROP POLICY IF EXISTS "Patients can insert their own record" ON public.patients;

CREATE POLICY "Patients can insert their own record"
  ON public.patients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() 
      AND users.id = patients.user_id
      AND users.role = 'patient'
    )
  );

-- 3. Verify the create_patient_record function exists
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'create_patient_record';

-- 4. If function doesn't exist, create it
CREATE OR REPLACE FUNCTION public.create_patient_record(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user exists and is a patient
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_user_id AND role = 'patient'
  ) THEN
    RAISE EXCEPTION 'User must be a patient to create patient record';
  END IF;

  -- Insert patient record
  INSERT INTO public.patients (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_patient_record TO authenticated;

-- 5. Test query - Check if you can see your patient record (replace USER_ID)
-- SELECT * FROM public.patients WHERE user_id = 'YOUR_USER_ID_HERE';

-- 6. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'patients';

