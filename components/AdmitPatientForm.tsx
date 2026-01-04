'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function AdmitPatientForm() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [admitting, setAdmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPatient(null)
    setSearching(true)

    try {
      const supabase = createClient()
      
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', searchQuery.trim().toLowerCase())
        .eq('role', 'patient')
        .single()

      if (userError || !userData) {
        setError('Patient not found. Please check the email and try again.')
        return
      }

      // Then, get the patient record with user details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*, users!user_id(*)')
        .eq('user_id', userData.id)
        .single()

      if (patientError) {
        throw patientError
      }

      if (!patientData) {
        setError('Patient not found. Please check the email and try again.')
        return
      }

      setPatient(patientData)
    } catch (err: any) {
      setError(err.message || 'Failed to search for patient')
    } finally {
      setSearching(false)
    }
  }

  const handleAdmit = async () => {
    if (!patient) return

    setError(null)
    setSuccess(null)
    setAdmitting(true)

    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Use the database function to admit patient (bypasses RLS)
      const { data, error: admitError } = await supabase.rpc('admit_patient', {
        p_patient_id: patient.id,
        p_hospital_id: user.id,
      })

      if (admitError) {
        console.error('Admit patient error:', admitError)
        throw admitError
      }

      // Verify the update worked by checking the patient record
      const { data: verifyData, error: verifyError } = await supabase
        .from('patients')
        .select('current_hospital_id')
        .eq('id', patient.id)
        .single()

      if (verifyError) {
        console.error('Verification error:', verifyError)
      } else {
        console.log('Patient current_hospital_id after admission:', verifyData?.current_hospital_id)
        console.log('Expected hospital_id:', user.id)
      }

      setSuccess(`Patient ${patient.users?.full_name || patient.users?.email} has been admitted to your hospital.`)
      setPatient(null)
      setSearchQuery('')
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to admit patient')
    } finally {
      setAdmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="searchQuery" className="block text-sm font-medium text-slate-700 mb-2">
            Patient Email
          </label>
          <input
            id="searchQuery"
            type="email"
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            placeholder="patient@example.com"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPatient(null)
              setError(null)
            }}
          />
        </div>
        <Button type="submit" disabled={searching} fullWidth>
          {searching ? 'Searching...' : 'Search Patient'}
        </Button>
      </form>

      {patient && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Patient Found</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-slate-700">Name:</span>{' '}
              <span className="text-slate-900">{patient.users?.full_name || 'Not set'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Email:</span>{' '}
              <span className="text-slate-900">{patient.users?.email}</span>
            </div>
            {patient.users?.phone && (
              <div>
                <span className="font-medium text-slate-700">Phone:</span>{' '}
                <span className="text-slate-900">{patient.users.phone}</span>
              </div>
            )}
            {patient.current_hospital_id && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This patient is currently admitted to another hospital. 
                  Admitting them will transfer them to your hospital.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button
              onClick={handleAdmit}
              disabled={admitting}
              variant="secondary"
              fullWidth
            >
              {admitting ? 'Admitting Patient...' : 'Admit Patient to Hospital'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

