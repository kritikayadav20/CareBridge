import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import AdmitPatientForm from '@/components/AdmitPatientForm'

export default async function HospitalPatientsPage() {
  const user = await requireRole('hospital')
  const supabase = await createClient()

  // Get all patients admitted to this hospital
  const { data: admittedPatients, error: patientsError } = await supabase
    .from('patients')
    .select('*, users!user_id(*)')
    .eq('current_hospital_id', user.id)
    .order('created_at', { ascending: false })

  if (patientsError) {
    console.error('Error fetching admitted patients:', patientsError)
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patient Management</h1>
            <p className="text-slate-600 mt-1">Admit and manage patients at your hospital</p>
          </div>
        </div>

        {/* Admit Patient Section */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Admit Patient</h2>
          <p className="text-sm text-slate-600 mb-4">
            Search for a patient by email or patient ID and admit them to your hospital.
          </p>
          <AdmitPatientForm />
        </Card>

        {/* Admitted Patients List */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Currently Admitted Patients</h2>
          {admittedPatients && admittedPatients.length > 0 ? (
            <div className="space-y-3">
              {admittedPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <Link href={`/dashboard/hospital/patients/${patient.id}`} className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {patient.users?.full_name || 'Unknown Patient'}
                        </h3>
                        <Badge variant="success" size="sm">Admitted</Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Email:</span>{' '}
                          {patient.users?.email || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Patient ID:</span>{' '}
                          <span className="font-mono text-xs">{patient.id.slice(0, 8)}...</span>
                        </div>
                        {patient.users?.phone && (
                          <div>
                            <span className="font-medium">Phone:</span>{' '}
                            {patient.users.phone}
                          </div>
                        )}
                        {patient.date_of_birth && (
                          <div>
                            <span className="font-medium">Date of Birth:</span>{' '}
                            {new Date(patient.date_of_birth).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="ml-4 flex gap-2">
                      <Link href={`/dashboard/hospital/patients/${patient.id}`}>
                        <Button variant="primary" size="sm">
                          View Records
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No patients admitted</h3>
              <p className="text-slate-600">
                Use the form above to search and admit patients to your hospital.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

