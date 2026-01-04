import { redirect } from 'next/navigation'
import { getCurrentUser, requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HealthChart from '@/components/HealthChart'
import HealthSummary from '@/components/HealthSummary'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import HealthRecordRow from '@/components/HealthRecordRow'

export default async function HealthRecordsPage() {
  const user = await requireRole('patient')
  const supabase = await createClient()

  // Try to get patient record using the helper function (bypasses RLS)
  let patient: any = null
  let patientError: any = null

  try {
    // First try using the helper function to bypass RLS
    const { data: patientData, error: functionError } = await supabase.rpc('get_patient_by_user_id', {
      p_user_id: user.id,
    })

    if (patientData && patientData.length > 0) {
      patient = patientData[0]
    } else if (!functionError) {
      // Patient record doesn't exist, try to create it
      const { data: patientId, error: createError } = await supabase.rpc('create_patient_record', {
        p_user_id: user.id,
      })

      if (patientId && !createError) {
        // Fetch the newly created patient record using the helper function
        const { data: newPatientData } = await supabase.rpc('get_patient_by_user_id', {
          p_user_id: user.id,
        })

        if (newPatientData && newPatientData.length > 0) {
          patient = newPatientData[0]
        }
      } else {
        patientError = createError
      }
    } else {
      patientError = functionError
    }
  } catch (err: any) {
    patientError = err
  }

  // Fetch health records - try multiple methods
  let healthRecords: any[] = []
  let healthRecordsError: any = null

  if (patient) {
    // Normal path: fetch health records using patient_id
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('patient_id', patient.id)
      .order('recorded_at', { ascending: true })
    
    healthRecords = data || []
    healthRecordsError = error
  }

  // If no records found or patient not found, try using helper function
  if (healthRecords.length === 0 || !patient) {
    const { data: functionRecords, error: functionError } = await supabase.rpc('get_health_records_by_user_id', {
      p_user_id: user.id,
    })

    if (functionRecords && functionRecords.length > 0) {
      healthRecords = functionRecords
      healthRecordsError = null
      
      // Extract patient_id from first health record if we don't have patient
      if (!patient && healthRecords.length > 0) {
        patient = { id: healthRecords[0].patient_id }
      }
    } else if (!healthRecordsError) {
      healthRecordsError = functionError
    }
  }

  // If still no patient record and no health records, show error
  if (!patient && healthRecords.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Patient record not found</h3>
            <p className="text-slate-600 mb-4">
              {patientError ? `Error: ${patientError.message}` : 'Unable to find or create patient record.'}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              This may be due to a permissions issue. Please run the SQL fix in Supabase or contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Show error if there's an issue fetching records
  if (healthRecordsError) {
    console.error('Error fetching health records:', healthRecordsError)
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-slate-800">
                CareBridge
              </Link>
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Health Records</h3>
              <p className="text-slate-600 mb-4">{healthRecordsError.message}</p>
              <p className="text-sm text-slate-500">Please refresh the page or contact support if this issue persists.</p>
            </div>
          </Card>
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
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Health Records</h1>
          <p className="text-slate-600 mt-1">Track and monitor your vital signs over time</p>
        </div>

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
                      <HealthRecordRow key={record.id} record={record} showActions={false} />
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
              <p className="text-slate-600 mb-6">Health records will be added by your doctor at the hospital</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
