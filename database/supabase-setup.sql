-- ============================================================================
-- CareBridge - Complete Supabase Setup SQL
-- ============================================================================
-- This file contains all SQL commands needed to set up CareBridge in Supabase
-- Run this entire file in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Users table (extends auth.users)
-- Stores user profile information and role
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'hospital')),
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Patients table
-- Stores patient-specific information
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Health records table (time-series data)
-- Stores patient vital signs over time
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  sugar_level DECIMAL(5,2),
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Transfers table
-- Manages patient transfer requests between hospitals
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  from_hospital_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_hospital_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('emergency', 'non-emergency')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'completed', 'cancelled')),
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Medical reports table
-- Stores metadata for uploaded medical reports
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  report_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Messages table (for telemedicine chat during transfers)
-- Real-time messaging for transfer coordination
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. INDEXES (for performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON public.health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_recorded_at ON public.health_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_transfers_patient_id ON public.transfers(patient_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_hospital_id ON public.transfers(to_hospital_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_hospital_id ON public.transfers(from_hospital_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_messages_transfer_id ON public.messages(transfer_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient_id ON public.medical_reports(patient_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Patients can view their own data" ON public.patients;
DROP POLICY IF EXISTS "Hospitals can view patient data for assigned transfers" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view patient data during active transfers" ON public.patients;
DROP POLICY IF EXISTS "Patients can view their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Hospitals can view health records for assigned transfers" ON public.health_records;
DROP POLICY IF EXISTS "Doctors can view health records during active transfers" ON public.health_records;
DROP POLICY IF EXISTS "Patients can insert their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can view transfers they are involved in" ON public.transfers;
DROP POLICY IF EXISTS "Hospitals can create transfer requests" ON public.transfers;
DROP POLICY IF EXISTS "Receiving hospitals can accept transfers" ON public.transfers;
DROP POLICY IF EXISTS "Patients can view their own reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Hospitals can view reports for assigned transfers" ON public.medical_reports;
DROP POLICY IF EXISTS "Doctors can view reports for assigned transfers" ON public.medical_reports;
DROP POLICY IF EXISTS "Patients can upload their own reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Users can view messages for transfers they are involved in" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for transfers they are involved in" ON public.messages;

-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Patients table policies
CREATE POLICY "Patients can view their own data"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.id = patients.user_id
    )
  );

CREATE POLICY "Hospitals can view patient data for assigned transfers"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = patients.id
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
      AND transfers.status IN ('accepted', 'completed')
    )
  );

CREATE POLICY "Doctors can view patient data during active transfers"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = patients.id
      AND transfers.status IN ('accepted', 'completed')
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'doctor'
    )
  );

-- Health records policies
CREATE POLICY "Patients can view their own health records"
  ON public.health_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = health_records.patient_id
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.id = patients.user_id
      )
    )
  );

CREATE POLICY "Hospitals can view health records for assigned transfers"
  ON public.health_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = health_records.patient_id
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
      AND transfers.status IN ('accepted', 'completed')
    )
  );

CREATE POLICY "Doctors can view health records during active transfers"
  ON public.health_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = health_records.patient_id
      AND transfers.status IN ('accepted', 'completed')
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'doctor'
    )
  );

CREATE POLICY "Patients can insert their own health records"
  ON public.health_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = health_records.patient_id
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.id = patients.user_id
      )
    )
  );

-- Transfers policies
CREATE POLICY "Users can view transfers they are involved in"
  ON public.transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = transfers.patient_id
      AND (
        patients.user_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
        OR transfers.to_hospital_id = auth.uid()
      )
    )
  );

CREATE POLICY "Hospitals can create transfer requests"
  ON public.transfers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'hospital'
    )
  );

CREATE POLICY "Receiving hospitals can accept transfers"
  ON public.transfers FOR UPDATE
  USING (
    to_hospital_id = auth.uid()
    AND status = 'requested'
  )
  WITH CHECK (
    to_hospital_id = auth.uid()
    AND status IN ('accepted', 'completed')
  );

-- Medical reports policies
CREATE POLICY "Patients can view their own reports"
  ON public.medical_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medical_reports.patient_id
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.id = patients.user_id
      )
    )
  );

CREATE POLICY "Hospitals can view reports for assigned transfers"
  ON public.medical_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = medical_reports.patient_id
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
      AND transfers.status IN ('accepted', 'completed')
    )
  );

CREATE POLICY "Doctors can view reports for assigned transfers"
  ON public.medical_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.patient_id = medical_reports.patient_id
      AND transfers.status IN ('accepted', 'completed')
      AND (
        transfers.to_hospital_id = auth.uid()
        OR transfers.from_hospital_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'doctor'
    )
  );

CREATE POLICY "Patients can upload their own reports"
  ON public.medical_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = medical_reports.patient_id
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.id = patients.user_id
      )
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages for transfers they are involved in"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.id = messages.transfer_id
      AND EXISTS (
        SELECT 1 FROM public.patients
        WHERE patients.id = transfers.patient_id
        AND (
          patients.user_id = auth.uid()
          OR transfers.from_hospital_id = auth.uid()
          OR transfers.to_hospital_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can send messages for transfers they are involved in"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transfers
      WHERE transfers.id = messages.transfer_id
      AND EXISTS (
        SELECT 1 FROM public.patients
        WHERE patients.id = transfers.patient_id
        AND (
          patients.user_id = auth.uid()
          OR transfers.from_hospital_id = auth.uid()
          OR transfers.to_hospital_id = auth.uid()
        )
      )
    )
    AND sender_id = auth.uid()
  );

-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically create patient record when user signs up as patient
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by the trigger below
  -- The patient record should be created in the application code
  -- This is here for reference if you want to automate it
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. STORAGE BUCKET POLICIES
-- ============================================================================
-- Note: Storage bucket must be created manually in Supabase Dashboard
-- Go to Storage → Create Bucket → Name: "medical-reports" → Make it PRIVATE
-- Then run the policies below

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Patients can upload their own medical reports" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view their own medical reports" ON storage.objects;
DROP POLICY IF EXISTS "Hospitals can view medical reports for assigned transfers" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view medical reports for assigned transfers" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete their own medical reports" ON storage.objects;

-- Storage policies for medical-reports bucket
-- These policies assume the bucket is named "medical-reports"
-- File path format: {patient_id}/{filename}

-- Allow patients to upload their own reports
-- File path format: {patient_id}/{filename}
CREATE POLICY "Patients can upload their own medical reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-reports'
    AND (
      -- Extract patient_id from path (first folder in path)
      (string_to_array(name, '/'))[1] IN (
        SELECT id::text FROM public.patients
        WHERE EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.id = patients.user_id
        )
      )
    )
  );

-- Allow patients to view their own reports
CREATE POLICY "Patients can view their own medical reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
    AND (
      (string_to_array(name, '/'))[1] IN (
        SELECT id::text FROM public.patients
        WHERE EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.id = patients.user_id
        )
      )
    )
  );

-- Allow hospitals to view reports for assigned transfers
CREATE POLICY "Hospitals can view medical reports for assigned transfers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
    AND (
      (string_to_array(name, '/'))[1] IN (
        SELECT patient_id::text FROM public.transfers
        WHERE (
          transfers.to_hospital_id = auth.uid()
          OR transfers.from_hospital_id = auth.uid()
        )
        AND transfers.status IN ('accepted', 'completed')
      )
    )
  );

-- Allow doctors to view reports for assigned transfers
CREATE POLICY "Doctors can view medical reports for assigned transfers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'doctor'
    )
    AND (
      (string_to_array(name, '/'))[1] IN (
        SELECT patient_id::text FROM public.transfers
        WHERE transfers.status IN ('accepted', 'completed')
        AND (
          transfers.to_hospital_id = auth.uid()
          OR transfers.from_hospital_id = auth.uid()
        )
      )
    )
  );

-- Allow patients to delete their own reports
CREATE POLICY "Patients can delete their own medical reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-reports'
    AND (
      (string_to_array(name, '/'))[1] IN (
        SELECT id::text FROM public.patients
        WHERE EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.id = patients.user_id
        )
      )
    )
  );

-- ============================================================================
-- 7. REALTIME SUBSCRIPTIONS (Optional - for messages table)
-- ============================================================================
-- Realtime is enabled by default in Supabase
-- To enable realtime for messages table, run this in SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Create storage bucket "medical-reports" in Supabase Dashboard (Storage → Create Bucket)
--    - Name: medical-reports
--    - Make it PRIVATE (not public)
-- 2. Enable Realtime for messages table (optional, for chat):
--    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- 3. Test the setup by creating a test user account
-- ============================================================================

