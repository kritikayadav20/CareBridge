'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function EditHealthRecordPage() {
  const router = useRouter()
  const params = useParams()
  const recordId = params.id as string
  
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    sugarLevel: '',
    recordedAt: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get patient record
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!patient) {
          setError('Patient record not found')
          setFetching(false)
          return
        }

        // Get health record
        const { data: record, error: recordError } = await supabase
          .from('health_records')
          .select('*')
          .eq('id', recordId)
          .eq('patient_id', patient.id)
          .single()

        if (recordError || !record) {
          setError('Health record not found')
          setFetching(false)
          return
        }

        // Populate form
        setFormData({
          bloodPressureSystolic: record.blood_pressure_systolic?.toString() || '',
          bloodPressureDiastolic: record.blood_pressure_diastolic?.toString() || '',
          heartRate: record.heart_rate?.toString() || '',
          sugarLevel: record.sugar_level?.toString() || '',
          recordedAt: new Date(record.recorded_at).toISOString().slice(0, 16),
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load health record')
      } finally {
        setFetching(false)
      }
    }

    if (recordId) {
      fetchRecord()
    }
  }, [recordId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get patient record
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patient) {
        throw new Error('Patient record not found')
      }

      // Update health record
      const { error: updateError } = await supabase
        .from('health_records')
        .update({
          blood_pressure_systolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : null,
          blood_pressure_diastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : null,
          heart_rate: formData.heartRate ? parseInt(formData.heartRate) : null,
          sugar_level: formData.sugarLevel ? parseFloat(formData.sugarLevel) : null,
          recorded_at: formData.recordedAt,
        })
        .eq('id', recordId)
        .eq('patient_id', patient.id)

      if (updateError) throw updateError

      router.push('/dashboard/health-records')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update health record')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading health record...</p>
        </div>
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
          <h1 className="text-3xl font-bold text-slate-900">Edit Health Record</h1>
          <p className="text-slate-600 mt-1">Update your vital signs and health metrics</p>
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
                {loading ? 'Updating Record...' : 'Update Health Record'}
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

