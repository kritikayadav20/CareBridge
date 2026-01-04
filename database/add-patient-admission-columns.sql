-- ============================================================================
-- Add Patient Admission Columns
-- ============================================================================
-- This script adds the columns needed for patient admission functionality
-- Run this in Supabase SQL Editor
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
-- Verification (Optional)
-- ============================================================================
-- Run this to verify the columns were added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'patients'
-- AND column_name IN ('current_hospital_id');
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'users'
-- AND column_name IN ('hospital_id');
-- ============================================================================

