-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'hospital')),
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Patients table
CREATE TABLE public.patients (
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
CREATE TABLE public.health_records (
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
CREATE TABLE public.transfers (
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
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  report_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Messages table (for telemedicine chat during transfers)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_health_records_patient_id ON public.health_records(patient_id);
CREATE INDEX idx_health_records_recorded_at ON public.health_records(recorded_at);
CREATE INDEX idx_transfers_patient_id ON public.transfers(patient_id);
CREATE INDEX idx_transfers_to_hospital_id ON public.transfers(to_hospital_id);
CREATE INDEX idx_transfers_status ON public.transfers(status);
CREATE INDEX idx_messages_transfer_id ON public.messages(transfer_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

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

