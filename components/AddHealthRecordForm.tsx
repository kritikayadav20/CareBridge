'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface AddHealthRecordFormProps {
  patientId: string
  onSuccess?: () => void
}

export default function AddHealthRecordForm({ patientId, onSuccess }: AddHealthRecordFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    sugarLevel: '',
    recordedAt: new Date().toISOString().slice(0, 16),
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Verify user is a doctor
      const { data: userData } = await supabase
        .from('users')
        .select('role, hospital_id')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'doctor') {
        throw new Error('Only doctors can add health records')
      }

      // Verify patient is at the doctor's hospital
      const { data: patient } = await supabase
        .from('patients')
        .select('current_hospital_id')
        .eq('id', patientId)
        .single()

      if (!patient) {
        throw new Error('Patient not found')
      }

      if (patient.current_hospital_id !== userData.hospital_id) {
        throw new Error('Patient is not at your hospital')
      }

      // Insert health record
      const { error: insertError } = await supabase
        .from('health_records')
        .insert({
          patient_id: patientId,
          blood_pressure_systolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : null,
          blood_pressure_diastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : null,
          heart_rate: formData.heartRate ? parseInt(formData.heartRate) : null,
          sugar_level: formData.sugarLevel ? parseFloat(formData.sugarLevel) : null,
          recorded_at: formData.recordedAt,
        })

      if (insertError) throw insertError

      setSuccess('Health record added successfully!')
      
      // Reset form
      setFormData({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        sugarLevel: '',
        recordedAt: new Date().toISOString().slice(0, 16),
      })

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to add health record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="recordedAt" className="block text-sm font-medium text-slate-700 mb-2">
            Date & Time
          </label>
          <input
            id="recordedAt"
            type="datetime-local"
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            value={formData.recordedAt}
            onChange={(e) => setFormData({ ...formData, recordedAt: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bloodPressureSystolic" className="block text-sm font-medium text-slate-700 mb-2">
              Blood Pressure (Systolic)
            </label>
            <input
              id="bloodPressureSystolic"
              type="number"
              min="0"
              max="300"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              placeholder="120"
              value={formData.bloodPressureSystolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bloodPressureDiastolic" className="block text-sm font-medium text-slate-700 mb-2">
              Blood Pressure (Diastolic)
            </label>
            <input
              id="bloodPressureDiastolic"
              type="number"
              min="0"
              max="200"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              placeholder="80"
              value={formData.bloodPressureDiastolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="heartRate" className="block text-sm font-medium text-slate-700 mb-2">
            Heart Rate (bpm)
          </label>
          <input
            id="heartRate"
            type="number"
            min="0"
            max="300"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            placeholder="72"
            value={formData.heartRate}
            onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="sugarLevel" className="block text-sm font-medium text-slate-700 mb-2">
            Sugar Level (mg/dL)
          </label>
          <input
            id="sugarLevel"
            type="number"
            step="0.1"
            min="0"
            max="1000"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            placeholder="100"
            value={formData.sugarLevel}
            onChange={(e) => setFormData({ ...formData, sugarLevel: e.target.value })}
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            size="lg"
          >
            {loading ? 'Adding Record...' : 'Add Health Record'}
          </Button>
        </div>
      </form>
    </div>
  )
}

