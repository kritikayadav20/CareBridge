export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'patient' | 'doctor' | 'hospital' | 'admin'
          full_name: string | null
          email: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'patient' | 'doctor' | 'hospital' | 'admin'
          full_name?: string | null
          email: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'patient' | 'doctor' | 'hospital' | 'admin'
          full_name?: string | null
          email?: string
          phone?: string | null
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string
          date_of_birth: string | null
          gender: string | null
          address: string | null
          emergency_contact: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          emergency_contact?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          emergency_contact?: string | null
          created_at?: string
        }
      }
      health_records: {
        Row: {
          id: string
          patient_id: string
          blood_pressure_systolic: number | null
          blood_pressure_diastolic: number | null
          heart_rate: number | null
          sugar_level: number | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          heart_rate?: number | null
          sugar_level?: number | null
          recorded_at: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          heart_rate?: number | null
          sugar_level?: number | null
          recorded_at?: string
          created_at?: string
        }
      }
      transfers: {
        Row: {
          id: string
          patient_id: string
          from_hospital_id: string | null
          to_hospital_id: string
          transfer_type: 'emergency' | 'non-emergency'
          status: 'requested' | 'accepted' | 'completed'
          reason: string | null
          requested_at: string
          accepted_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          from_hospital_id?: string | null
          to_hospital_id: string
          transfer_type: 'emergency' | 'non-emergency'
          status?: 'requested' | 'accepted' | 'completed'
          reason?: string | null
          requested_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          from_hospital_id?: string | null
          to_hospital_id?: string
          transfer_type?: 'emergency' | 'non-emergency'
          status?: 'requested' | 'accepted' | 'completed'
          reason?: string | null
          requested_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      medical_reports: {
        Row: {
          id: string
          patient_id: string
          report_name: string
          file_url: string
          report_type: string | null
          uploaded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          report_name: string
          file_url: string
          report_type?: string | null
          uploaded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          report_name?: string
          file_url?: string
          report_type?: string | null
          uploaded_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          transfer_id: string
          sender_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          transfer_id: string
          sender_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          transfer_id?: string
          sender_id?: string
          message?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

