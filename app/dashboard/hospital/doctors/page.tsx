import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import CreateDoctorSection from '@/components/CreateDoctorSection'

export default async function HospitalDoctorsPage() {
  const user = await requireRole('hospital')
  const supabase = await createClient()

  // Get all doctors belonging to this hospital
  const { data: doctors } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'doctor')
    .eq('hospital_id', user.id)
    .order('created_at', { ascending: false })

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
          <h1 className="text-3xl font-bold text-slate-900">Doctor Management</h1>
          <p className="text-slate-600 mt-1">Create and manage doctors at your hospital</p>
        </div>

        {/* Create Doctor Section */}
        <CreateDoctorSection />

        {/* Doctors List */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Hospital Doctors</h2>
          {doctors && doctors.length > 0 ? (
            <div className="space-y-3">
              {doctors.map((doctor: any) => (
                <div
                  key={doctor.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {doctor.full_name || 'Unknown Doctor'}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600 mt-2">
                        <div>
                          <span className="font-medium">Email:</span>{' '}
                          {doctor.email}
                        </div>
                        {doctor.phone && (
                          <div>
                            <span className="font-medium">Phone:</span>{' '}
                            {doctor.phone}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(doctor.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No doctors yet</h3>
              <p className="text-slate-600">
                Use the form above to create doctor accounts for your hospital.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

