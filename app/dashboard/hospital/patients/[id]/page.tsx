import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HealthChart from '@/components/HealthChart'
import HealthSummary from '@/components/HealthSummary'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import HealthRecordRow from '@/components/HealthRecordRow'

export default async function HospitalPatientDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const user = await requireRole('hospital')
  const supabase = await createClient()

  // Await params if it's a Promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params)
  const patientId = resolvedParams.id

  if (!patientId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">Invalid patient ID</p>
            <Link href="/dashboard/hospital/patients">
              <Button variant="outline">Back to Patients</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Get patient details - try with explicit relationship first
  let patient: any = null
  let patientError: any = null

  // First try with explicit relationship
  const { data: patientData, error: error1 } = await supabase
    .from('patients')
    .select('*, users!user_id(id, full_name, email, phone)')
    .eq('id', patientId)
    .single()

  if (patientData && !error1) {
    patient = patientData
  } else {
    // Fallback: fetch patient and user separately
    const { data: patientOnly, error: error2 } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (patientOnly && !error2) {
      // Fetch user separately
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', patientOnly.user_id)
        .single()

      patient = {
        ...patientOnly,
        users: userData || null
      }
    } else {
      patientError = error2 || error1
    }
  }

  if (patientError || !patient) {
    console.error('Error fetching patient:', patientError)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">Patient not found</p>
            <p className="text-sm text-slate-500 mb-4">
              {patientError?.message || 'Unable to load patient information'}
            </p>
            <Link href="/dashboard/hospital/patients">
              <Button variant="outline">Back to Patients</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Verify patient is admitted to this hospital
  if (patient.current_hospital_id !== user.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <p className="text-red-600">Access denied. This patient is not admitted to your hospital.</p>
        </Card>
      </div>
    )
  }

  // Fetch health records
  const { data: healthRecords, error: recordsError } = await supabase
    .from('health_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: true })

  if (recordsError) {
    console.error('Error fetching health records:', recordsError)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-slate-800">
              CareBridge
            </Link>
            <Link href="/dashboard/hospital/patients" className="text-sm text-slate-600 hover:text-slate-900">
              ← Back to Patients
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Patient Info */}
        <Card className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {patient.users?.full_name || 'Unknown Patient'}
              </h1>
              <p className="text-slate-600 mb-1">
                <span className="font-medium">Email:</span> {patient.users?.email || 'N/A'}
              </p>
              {patient.users?.phone && (
                <p className="text-slate-600">
                  <span className="font-medium">Phone:</span> {patient.users.phone}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Patient ID</p>
              <p className="text-xs font-mono text-slate-400">{patient.id.slice(0, 8)}...</p>
            </div>
          </div>
        </Card>

        {/* Health Records Display */}
        {healthRecords && healthRecords.length > 0 ? (
          <div className="space-y-6">
            {/* Health Chart */}
            <Card>
              <HealthChart records={healthRecords} />
            </Card>
            
            {/* AI Health Summary */}
            <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">AI Health Summary</h2>
                  <p className="text-xs text-slate-600 mb-4">
                    Powered by Google Cloud Gemini • Informational purposes only
                  </p>
                  <HealthSummary records={healthRecords} />
                </div>
              </div>
            </Card>
            
            {/* Health Records Table */}
            <Card>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">All Records</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Blood Pressure
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Heart Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Sugar Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {healthRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(record.recorded_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.blood_pressure_systolic && record.blood_pressure_diastolic
                            ? `${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.heart_rate ? `${record.heart_rate} bpm` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.sugar_level ? `${record.sugar_level} mg/dL` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No health records yet</h3>
              <p className="text-slate-600">Health records will appear here when added by doctors</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

