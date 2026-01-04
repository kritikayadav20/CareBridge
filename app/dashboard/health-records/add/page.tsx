'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function AddHealthRecordPage() {
  const router = useRouter()
  const [checkingAccess, setCheckingAccess] = useState(true)
  
  useEffect(() => {
    // Redirect patients - they can't add health records
    const checkAccess = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData?.role === 'patient') {
          router.push('/dashboard/health-records')
          return
        }
      }
      setCheckingAccess(false)
    }
    
    checkAccess()
  }, [router])
  
  // This page should not be accessible to patients
  // Only doctors can add health records (via the doctor patient detail page)
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    sugarLevel: '',
    recordedAt: new Date().toISOString().slice(0, 16),
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure patient record exists (create if needed) via API route
      const ensureResponse = await fetch('/api/patients/ensure-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const ensureData = await ensureResponse.json()

      // Get patient_id - either from API response or fetch it
      let patientId: string | null = ensureData.patient_id || null

      // If API didn't return patient_id, fetch it directly
      if (!patientId) {
        // Wait a moment for the record to be available
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (patient && !patientError) {
          patientId = patient.id
        } else if (!ensureResponse.ok) {
          // Only throw error if API failed AND we can't fetch
          const errorMsg = ensureData.details 
            ? `${ensureData.error}\n\n${ensureData.details}`
            : ensureData.error || 'Failed to ensure patient record exists'
          throw new Error(errorMsg)
        } else if (ensureData.message) {
          // API says record was created, but we can't fetch it yet
          // Try one more time after a longer delay
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const { data: retryPatient, error: retryError } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (retryPatient && !retryError) {
            patientId = retryPatient.id
          } else {
            throw new Error('Patient record was created but is not yet available. Please wait a moment and try again.')
          }
        }
      }

      if (!patientId) {
        throw new Error('Could not get patient record. Please refresh the page and try again.')
      }

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

      router.push('/dashboard/health-records')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to add health record')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <p className="text-slate-600">Loading...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-slate-800">
              CareBridge
            </Link>
            <Link href="/dashboard/health-records" className="text-sm text-slate-600 hover:text-slate-900">
              ← Back to Health Records
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Add Health Record</h1>
          <p className="text-slate-600 mt-1">Record your vital signs and health metrics</p>
        </div>

        <Card>
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
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

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                fullWidth
                size="lg"
              >
                {loading ? 'Adding Record...' : 'Add Health Record'}
              </Button>
              <Link href="/dashboard/health-records">
                <Button variant="outline" size="lg">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

