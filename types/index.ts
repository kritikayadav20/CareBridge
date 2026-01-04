import { Database } from './database'

export type User = Database['public']['Tables']['users']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type HealthRecord = Database['public']['Tables']['health_records']['Row']
export type Transfer = Database['public']['Tables']['transfers']['Row']
export type MedicalReport = Database['public']['Tables']['medical_reports']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export type UserRole = 'patient' | 'doctor' | 'hospital' | 'admin'
export type TransferType = 'emergency' | 'non-emergency'
export type TransferStatus = 'requested' | 'accepted' | 'completed'

