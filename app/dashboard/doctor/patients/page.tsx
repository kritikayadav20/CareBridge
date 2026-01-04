import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default async function DoctorPatientsPage() {
  const user = await requireRole('doctor')
  const supabase = await createClient()

  // Get doctor's hospital_id
  const { data: doctorData } = await supabase
    .from('users')
    .select('hospital_id')
    .eq('id', user.id)
    .single()

  if (!doctorData?.hospital_id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Hospital Assigned</h3>
            <p className="text-slate-600">You need to be assigned to a hospital to view patients.</p>
          </div>
        </Card>
      </div>
    )
  }

  // Get all patients admitted to the doctor's hospital
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*, users!user_id(id, full_name, email, phone)')
    .eq('current_hospital_id', doctorData.hospital_id)
    .order('created_at', { ascending: false })

  if (patientsError) {
    console.error('Error fetching patients:', patientsError)
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
          <h1 className="text-3xl font-bold text-slate-900">My Patients</h1>
          <p className="text-slate-600 mt-1">View and manage patients at your hospital</p>
        </div>

        {patients && patients.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient: any) => (
              <Link
                key={patient.id}
                href={`/dashboard/doctor/patients/${patient.id}`}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {patient.users?.full_name || 'Unknown Patient'}
                    </h3>
                    <p className="text-sm text-slate-600 mb-1">
                      <span className="font-medium">Email:</span> {patient.users?.email || 'N/A'}
                    </p>
                    {patient.users?.phone && (
                      <p className="text-sm text-slate-600 mb-3">
                        <span className="font-medium">Phone:</span> {patient.users.phone}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        Patient ID: {patient.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 10a2 2 0 100-4 2 2 0 000 4zm0 0v6a2 2 0 002 2h4a2 2 0 002-2v-6m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No patients found</h3>
              <p className="text-slate-600">
                There are no patients currently admitted to your hospital.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

