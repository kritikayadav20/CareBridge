'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function NewTransferForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    patientId: '',
    toHospitalId: '',
    transferType: 'non-emergency' as 'emergency' | 'non-emergency',
    reason: '',
  })
  const [patients, setPatients] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Verify user is a hospital
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'hospital') {
        setError('Only hospitals can create transfer requests')
        setFetching(false)
        return
      }

      // Fetch only patients admitted to this hospital
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, users!user_id(id, full_name, email)')
        .eq('current_hospital_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch active transfer requests to exclude patients with pending transfers
      const { data: activeTransfers } = await supabase
        .from('transfers')
        .select('patient_id')
        .eq('from_hospital_id', user.id)
        .in('status', ['requested', 'accepted'])

      // Get list of patient IDs with active transfers
      const patientIdsWithTransfers = new Set(
        (activeTransfers || []).map(t => t.patient_id)
      )

      // Filter out patients with active transfers
      const availablePatients = (patientsData || []).filter(
        patient => !patientIdsWithTransfers.has(patient.id)
      )

      // Fetch hospitals (excluding current hospital)
      const { data: hospitalsData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'hospital')
        .neq('id', user.id)
        .order('full_name', { ascending: true })

      setPatients(availablePatients)
      setHospitals(hospitalsData || [])
      setFetching(false)
    }

    fetchData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Verify user is a hospital
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'hospital') {
        throw new Error('Only hospitals can create transfer requests')
      }

      // Verify patient is admitted to this hospital
      const { data: patientData } = await supabase
        .from('patients')
        .select('current_hospital_id')
        .eq('id', formData.patientId)
        .single()

      if (!patientData) {
        throw new Error('Patient not found')
      }

      if (patientData.current_hospital_id !== user.id) {
        throw new Error('Patient is not admitted to your hospital')
      }

      // Check for existing active transfer requests for this patient
      const { data: existingTransfers, error: checkError } = await supabase
        .from('transfers')
        .select('id, status, to_hospital_id')
        .eq('patient_id', formData.patientId)
        .eq('from_hospital_id', user.id)
        .in('status', ['requested', 'accepted'])

      if (checkError) {
        console.error('Error checking existing transfers:', checkError)
      }

      if (existingTransfers && existingTransfers.length > 0) {
        // Check if there's a duplicate to the same hospital
        const duplicateToSameHospital = existingTransfers.find(
          t => t.to_hospital_id === formData.toHospitalId
        )
        
        if (duplicateToSameHospital) {
          throw new Error('A transfer request for this patient to the selected hospital already exists and is pending.')
        }
        
        // Warn if there are other active transfers
        if (existingTransfers.length > 0) {
          throw new Error(`This patient already has ${existingTransfers.length} active transfer request(s). Please wait for them to be completed or cancelled before creating a new one.`)
        }
      }

      // Create transfer request
      const { error: insertError } = await supabase
        .from('transfers')
        .insert({
          patient_id: formData.patientId,
          from_hospital_id: user.id,
          to_hospital_id: formData.toHospitalId,
          transfer_type: formData.transferType,
          reason: formData.reason || null,
          status: 'requested',
        })

      if (insertError) throw insertError

      router.push('/dashboard/transfers')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create transfer request')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
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
            <Link href="/dashboard/transfers" className="text-sm text-slate-600 hover:text-slate-900">
              ← Back to Transfers
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Request Patient Transfer</h1>
          <p className="text-slate-600 mt-1">Initiate a transfer request to another hospital</p>
        </div>

        <Card>
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-slate-700 mb-2">
                Patient <span className="text-slate-400 font-normal">(must be admitted to your hospital)</span>
              </label>
              {patients.length > 0 ? (
                <select
                  id="patientId"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.users?.full_name || patient.users?.email || patient.id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-2">
                    <strong>No patients admitted:</strong> You need to admit patients to your hospital before requesting transfers.
                  </p>
                  <Link href="/dashboard/hospital/patients">
                    <Button variant="outline" size="sm">Go to Patient Management</Button>
                  </Link>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="toHospitalId" className="block text-sm font-medium text-slate-700 mb-2">
                Receiving Hospital
              </label>
              {hospitals.length > 0 ? (
                <select
                  id="toHospitalId"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  value={formData.toHospitalId}
                  onChange={(e) => setFormData({ ...formData, toHospitalId: e.target.value })}
                >
                  <option value="">Select a hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.full_name || hospital.email}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>No other hospitals available:</strong> There are no other hospitals in the system to transfer to.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="transferType" className="block text-sm font-medium text-slate-700 mb-2">
                Transfer Type
              </label>
              <select
                id="transferType"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                value={formData.transferType}
                onChange={(e) => setFormData({ ...formData, transferType: e.target.value as any })}
              >
                <option value="non-emergency">Non-Emergency</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-2">
                Reason <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="reason"
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 resize-none"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter the reason for transfer..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || patients.length === 0 || hospitals.length === 0}
                fullWidth
                size="lg"
              >
                {loading ? 'Creating Transfer Request...' : 'Request Transfer'}
              </Button>
              <Link href="/dashboard/transfers">
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

