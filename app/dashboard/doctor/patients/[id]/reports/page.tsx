import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PatientReportsManager from '@/components/PatientReportsManager'

export default async function DoctorPatientReportsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  const user = await requireRole('doctor')
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
            <Link href="/dashboard/doctor/patients">
              <Button variant="outline">Back to Patients</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Get doctor's hospital_id
  const { data: doctorData } = await supabase
    .from('users')
    .select('hospital_id')
    .eq('id', user.id)
    .single()

  if (!doctorData?.hospital_id) {
    redirect('/dashboard')
  }

  // Get patient details
  let patient: any = null
  let patientError: any = null

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
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">Patient not found</p>
            <Link href="/dashboard/doctor/patients">
              <Button variant="outline">Back to Patients</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Verify patient is at the doctor's hospital
  if (patient.current_hospital_id !== doctorData.hospital_id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <p className="text-red-600">Access denied. This patient is not at your hospital.</p>
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
            <Link href={`/dashboard/doctor/patients/${patientId}`} className="text-sm text-slate-600 hover:text-slate-900">
              ← Back to Patient
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
                Medical Reports - {patient.users?.full_name || 'Unknown Patient'}
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
          </div>
        </Card>

        {/* Reports Manager Component */}
        <PatientReportsManager patientId={patientId} />
      </div>
    </div>
  )
}

