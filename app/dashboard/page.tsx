import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import StatusIndicator from '@/components/ui/StatusIndicator'
import HealthStatusIndicator from '@/components/HealthStatusIndicator'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get role-specific data
  let dashboardData: any = {}

  if (user.role === 'patient') {
    // Get patient record directly from patients table
    let patient: any = null
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (patientError) {
        console.error('Error fetching patient:', patientError)
      } else {
        patient = patientData
      }
      
      // Also fetch current hospital info if admitted
      if (patient?.current_hospital_id) {
        const { data: hospitalData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', patient.current_hospital_id)
          .single()
        if (hospitalData) {
          patient.current_hospital = hospitalData
        }
      }
    } catch (err) {
      console.error('Error fetching patient:', err)
    }

    // Fetch health records - try multiple methods
    let healthRecords: any[] = []
    
    if (patient) {
      // Normal path: fetch using patient_id
      const { data } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_id', patient.id)
        .order('recorded_at', { ascending: false })
        .limit(5)
      healthRecords = data || []
    }

    // Fallback: use helper function to get health records directly
    if (healthRecords.length === 0) {
      const { data: functionRecords } = await supabase.rpc('get_health_records_by_user_id', {
        p_user_id: user.id,
      })
      if (functionRecords && functionRecords.length > 0) {
        // Function returns ASC, we need DESC for dashboard (most recent first)
        healthRecords = [...functionRecords].reverse().slice(0, 5)
        // Extract patient_id from first record if we don't have patient
        if (!patient && healthRecords.length > 0) {
          patient = { id: healthRecords[0].patient_id }
        }
      }
    }

    const { data: transfers } = await supabase
      .from('transfers')
      .select('*, patients!inner(user_id), to_hospital:users!transfers_to_hospital_id_fkey(*), from_hospital:users!transfers_from_hospital_id_fkey(*)')
      .eq('patients.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    dashboardData = { patient, healthRecords, transfers }
  } else if (user.role === 'hospital') {
    // Fetch incoming transfers - fetch separately to avoid relationship issues
    const { data: incomingTransfersData, error: incomingError } = await supabase
      .from('transfers')
      .select('*')
      .eq('to_hospital_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (incomingError) {
      console.error('Error fetching incoming transfers:', incomingError)
    }

    // Fetch outgoing transfers
    const { data: outgoingTransfersData, error: outgoingError } = await supabase
      .from('transfers')
      .select('*')
      .eq('from_hospital_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (outgoingError) {
      console.error('Error fetching outgoing transfers:', outgoingError)
    }

    // Collect patient and hospital IDs
    const patientIds = new Set<string>()
    const hospitalIds = new Set<string>()
    
    ;(incomingTransfersData || []).forEach(t => {
      if (t.patient_id) patientIds.add(t.patient_id)
      if (t.from_hospital_id) hospitalIds.add(t.from_hospital_id)
      if (t.to_hospital_id) hospitalIds.add(t.to_hospital_id)
    })
    
    ;(outgoingTransfersData || []).forEach(t => {
      if (t.patient_id) patientIds.add(t.patient_id)
      if (t.from_hospital_id) hospitalIds.add(t.from_hospital_id)
      if (t.to_hospital_id) hospitalIds.add(t.to_hospital_id)
    })

    // Fetch patient data
    let patientMap: Record<string, any> = {}
    if (patientIds.size > 0) {
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, user_id')
        .in('id', Array.from(patientIds))

      if (patientsData) {
        const userIds = patientsData.map(p => p.user_id).filter(Boolean)
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', userIds)

          if (usersData) {
            const userMap: Record<string, any> = {}
            usersData.forEach(u => {
              userMap[u.id] = u
            })

            patientsData.forEach(p => {
              patientMap[p.id] = {
                ...p,
                users: userMap[p.user_id] || null
              }
            })
          }
        }
      }
    }

    // Fetch hospital data
    let hospitalMap: Record<string, any> = {}
    if (hospitalIds.size > 0) {
      const { data: hospitalsData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', Array.from(hospitalIds))
        .eq('role', 'hospital')

      if (hospitalsData) {
        hospitalsData.forEach(h => {
          hospitalMap[h.id] = h
        })
      }
    }

    // Combine transfers with related data
    const incomingTransfers = (incomingTransfersData || []).map(t => ({
      ...t,
      patients: patientMap[t.patient_id] || null,
      from_hospital: hospitalMap[t.from_hospital_id] || null,
      to_hospital: hospitalMap[t.to_hospital_id] || null,
    }))

    const outgoingTransfers = (outgoingTransfersData || []).map(t => ({
      ...t,
      patients: patientMap[t.patient_id] || null,
      from_hospital: hospitalMap[t.from_hospital_id] || null,
      to_hospital: hospitalMap[t.to_hospital_id] || null,
    }))

    const { data: admittedPatients } = await supabase
      .from('patients')
      .select('*, users!user_id(*)')
      .eq('current_hospital_id', user.id)
      .limit(5)
      .order('created_at', { ascending: false })

    dashboardData = { incomingTransfers, outgoingTransfers, admittedPatients }
  } else if (user.role === 'doctor') {
    // Get doctor's hospital_id and hospital info
    const { data: doctorData } = await supabase
      .from('users')
      .select('hospital_id')
      .eq('id', user.id)
      .single()

    // Fetch hospital information
    let hospitalInfo: any = null
    if (doctorData?.hospital_id) {
      const { data: hospitalData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', doctorData.hospital_id)
        .eq('role', 'hospital')
        .single()
      
      hospitalInfo = hospitalData
    }

    let patients: any[] = []
    if (doctorData?.hospital_id) {
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*, users!user_id(id, full_name, email)')
        .eq('current_hospital_id', doctorData.hospital_id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      patients = patientsData || []
    }

    // Fetch transfers for this doctor's hospital
    // Include transfers FROM or TO this hospital (similar to hospital dashboard)
    let transfers: any[] = []
    if (doctorData?.hospital_id) {
      // Fetch incoming transfers (to this hospital)
      const { data: incomingTransfersData } = await supabase
        .from('transfers')
        .select('*')
        .eq('to_hospital_id', doctorData.hospital_id)
        .in('status', ['requested', 'accepted', 'completed'])
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch outgoing transfers (from this hospital)
      const { data: outgoingTransfersData } = await supabase
        .from('transfers')
        .select('*')
        .eq('from_hospital_id', doctorData.hospital_id)
        .in('status', ['requested', 'accepted', 'completed'])
        .order('created_at', { ascending: false })
        .limit(10)

      // Combine both incoming and outgoing transfers
      const allTransfers = [
        ...(incomingTransfersData || []),
        ...(outgoingTransfersData || [])
      ]

      if (allTransfers.length > 0) {
        // Collect patient and hospital IDs
        const patientIds = new Set<string>()
        const hospitalIds = new Set<string>()
        
        allTransfers.forEach(t => {
          if (t.patient_id) patientIds.add(t.patient_id)
          if (t.from_hospital_id) hospitalIds.add(t.from_hospital_id)
          if (t.to_hospital_id) hospitalIds.add(t.to_hospital_id)
        })

        // Fetch patient data
        let patientMap: Record<string, any> = {}
        if (patientIds.size > 0) {
          const { data: patientsData } = await supabase
            .from('patients')
            .select('id, user_id')
            .in('id', Array.from(patientIds))

          if (patientsData) {
            const userIds = patientsData.map(p => p.user_id).filter(Boolean)
            
            if (userIds.length > 0) {
              const { data: usersData } = await supabase
                .from('users')
                .select('id, full_name, email')
                .in('id', userIds)

              if (usersData) {
                const userMap: Record<string, any> = {}
                usersData.forEach(u => {
                  userMap[u.id] = u
                })

                patientsData.forEach(p => {
                  patientMap[p.id] = {
                    ...p,
                    users: userMap[p.user_id] || null
                  }
                })
              }
            }
          }
        }

        // Fetch hospital data
        let hospitalMap: Record<string, any> = {}
        if (hospitalIds.size > 0) {
          const { data: hospitalsData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', Array.from(hospitalIds))
            .eq('role', 'hospital')

          if (hospitalsData) {
            hospitalsData.forEach(h => {
              hospitalMap[h.id] = h
            })
          }
        }

        // Combine transfers with related data
        transfers = allTransfers.map(t => ({
          ...t,
          patients: patientMap[t.patient_id] || null,
          from_hospital: hospitalMap[t.from_hospital_id] || null,
          to_hospital: hospitalMap[t.to_hospital_id] || null,
        }))

        // Sort by created_at descending and limit to 10
        transfers = transfers
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
      }
    }

    dashboardData = { transfers, patients, hospitalId: doctorData?.hospital_id, hospitalInfo }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold text-slate-800">
                CareBridge
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  Dashboard
                </Link>
                {user.role === 'patient' && (
                  <>
                    <Link href="/dashboard/health-records" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                      Health Records
                    </Link>
                    <Link href="/dashboard/reports" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                      Reports
                    </Link>
                  </>
                )}
                {user.role === 'hospital' && (
                  <>
                    <Link href="/dashboard/hospital/patients" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                      Patients
                    </Link>
                    <Link href="/dashboard/hospital/doctors" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                      Doctors
                    </Link>
                    <Link href="/dashboard/transfers" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                      Transfers
                    </Link>
                  </>
                )}
                {user.role === 'doctor' && (
                  <>
                    <Link href="/dashboard/doctor/patients" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                      Patients
                    </Link>
                    <Link href="/dashboard/transfers" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                      Transfers
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/profile"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Profile
              </Link>
              <span className="text-sm text-slate-500">|</span>
              <span className="text-sm text-slate-600">
                {user.full_name || user.email}
              </span>
              <Badge variant="info" size="sm">
                {user.role}
              </Badge>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-sm text-slate-600 hover:text-red-600"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Patient Dashboard */}
        {user.role === 'patient' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.full_name || 'Patient'}</h1>
              <p className="text-slate-600 mt-1">Monitor your health and manage transfers</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Patient Profile Card */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Patient Profile</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="text-base font-medium text-slate-900">{user.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-base font-medium text-slate-900">{user.email}</p>
                  </div>
                  {dashboardData.patient?.date_of_birth && (
                    <div>
                      <p className="text-sm text-slate-500">Date of Birth</p>
                      <p className="text-base font-medium text-slate-900">
                        {new Date(dashboardData.patient.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-1">Hospital Status</p>
                    {dashboardData.patient?.current_hospital_id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" size="sm">Admitted</Badge>
                        </div>
                        {dashboardData.patient?.current_hospital ? (
                          <div>
                            <p className="text-xs text-slate-500">Hospital Name</p>
                            <p className="text-sm font-medium text-slate-900">
                              {dashboardData.patient.current_hospital.full_name || dashboardData.patient.current_hospital.email || 'Unknown Hospital'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600">
                            Currently admitted to a hospital
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">Not Admitted</Badge>
                        <p className="text-xs text-slate-600">
                          Not currently admitted to any hospital
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Recent Vitals */}
              <Card className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Health Records</h3>
                  <Link href="/dashboard/health-records">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
                {dashboardData.healthRecords && dashboardData.healthRecords.length > 0 ? (
                  <div className="space-y-4">
                    {/* Latest Record with Status Indicators */}
                    {dashboardData.healthRecords[0] && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Latest Reading</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(dashboardData.healthRecords[0].recorded_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {dashboardData.healthRecords[0].blood_pressure_systolic && dashboardData.healthRecords[0].blood_pressure_diastolic && (
                            <HealthStatusIndicator
                              type="blood_pressure"
                              value={null}
                              systolic={dashboardData.healthRecords[0].blood_pressure_systolic}
                              diastolic={dashboardData.healthRecords[0].blood_pressure_diastolic}
                            />
                          )}
                          {dashboardData.healthRecords[0].heart_rate && (
                            <HealthStatusIndicator
                              type="heart_rate"
                              value={dashboardData.healthRecords[0].heart_rate}
                            />
                          )}
                          {dashboardData.healthRecords[0].sugar_level && (
                            <HealthStatusIndicator
                              type="sugar_level"
                              value={dashboardData.healthRecords[0].sugar_level}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Previous Records */}
                    <div className="space-y-2">
                      {dashboardData.healthRecords.slice(1).map((record: any) => (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-500">
                              {new Date(record.recorded_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              {record.blood_pressure_systolic && (
                                <div>
                                  <span className="text-slate-500">BP: </span>
                                  <span className="font-medium text-slate-900">
                                    {record.blood_pressure_systolic}/{record.blood_pressure_diastolic}
                                  </span>
                                </div>
                              )}
                              {record.heart_rate && (
                                <div>
                                  <span className="text-slate-500">HR: </span>
                                  <span className="font-medium text-slate-900">{record.heart_rate} bpm</span>
                                </div>
                              )}
                              {record.sugar_level && (
                                <div>
                                  <span className="text-slate-500">Sugar: </span>
                                  <span className="font-medium text-slate-900">{record.sugar_level} mg/dL</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No health records yet</p>
                    <Link href="/dashboard/health-records/add" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                      Add your first record
                    </Link>
                  </div>
                )}
              </Card>
            </div>

            {/* Transfer History */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Transfer History</h3>
                <Link href="/dashboard/transfers">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              {dashboardData.transfers && dashboardData.transfers.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.transfers.map((transfer: any) => (
                    <Link
                      key={transfer.id}
                      href={`/dashboard/transfers/${transfer.id}`}
                      className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {transfer.from_hospital?.full_name || 'Unknown'} → {transfer.to_hospital?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {new Date(transfer.requested_at || transfer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusIndicator status={transfer.status} transferType={transfer.transfer_type} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No transfers yet</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Hospital Dashboard */}
        {user.role === 'hospital' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Hospital Dashboard</h1>
                <p className="text-slate-600 mt-1">Manage patients, transfers, and requests</p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/hospital/patients">
                  <Button variant="secondary" size="lg">Manage Patients</Button>
                </Link>
                <Link href="/dashboard/transfers/new">
                  <Button size="lg">Request Transfer</Button>
                </Link>
              </div>
            </div>

            {/* Admitted Patients Summary */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Admitted Patients</h3>
                <Link href="/dashboard/hospital/patients">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              {dashboardData.admittedPatients && dashboardData.admittedPatients.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.admittedPatients.map((patient: any) => (
                    <Link
                      key={patient.id}
                      href={`/dashboard/hospital/patients/${patient.id}`}
                      className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <p className="font-medium text-slate-900">
                        {patient.users?.full_name || patient.users?.email || 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{patient.users?.email}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No patients currently admitted</p>
                  <Link href="/dashboard/hospital/patients" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                    Admit a patient
                  </Link>
                </div>
              )}
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Incoming Transfers */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Incoming Transfer Requests</h3>
                {dashboardData.incomingTransfers && dashboardData.incomingTransfers.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.incomingTransfers.map((transfer: any) => (
                      <div
                        key={transfer.id}
                        className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border-l-4 border-blue-500"
                      >
                        <Link
                          href={`/dashboard/transfers/${transfer.id}`}
                          className="block"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {transfer.patients?.users?.full_name || 'Unknown Patient'}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                From: {transfer.from_hospital?.full_name || 'Unknown Hospital'}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(transfer.requested_at || transfer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <StatusIndicator status={transfer.status} transferType={transfer.transfer_type} />
                          </div>
                        </Link>
                        {transfer.status === 'requested' && (
                          <div className="mt-3">
                            <Link href={`/dashboard/transfers/${transfer.id}`}>
                              <Button size="sm" fullWidth>Review & Accept</Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No incoming transfers</p>
                  </div>
                )}
              </Card>

              {/* Outgoing Transfers */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Outgoing Transfer Requests</h3>
                {dashboardData.outgoingTransfers && dashboardData.outgoingTransfers.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.outgoingTransfers.map((transfer: any) => (
                      <Link
                        key={transfer.id}
                        href={`/dashboard/transfers/${transfer.id}`}
                        className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              {transfer.patients?.users?.full_name || 'Unknown Patient'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              To: {transfer.to_hospital?.full_name || 'Unknown Hospital'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(transfer.requested_at).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusIndicator status={transfer.status} transferType={transfer.transfer_type} />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No outgoing transfers</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Doctor Dashboard */}
        {user.role === 'doctor' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.full_name || 'Doctor'}</h1>
              <p className="text-slate-600 mt-1">Manage patients and view transfers</p>
              {dashboardData.hospitalInfo && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Hospital</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {dashboardData.hospitalInfo.full_name || dashboardData.hospitalInfo.email || 'Unknown Hospital'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Patients Section */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">My Patients</h3>
                <Link href="/dashboard/doctor/patients">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              {dashboardData.patients && dashboardData.patients.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.patients.map((patient: any) => (
                    <Link
                      key={patient.id}
                      href={`/dashboard/doctor/patients/${patient.id}`}
                      className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {patient.users?.full_name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {patient.users?.email || 'No email'}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="mb-4">No patients at your hospital</p>
                  {!dashboardData.hospitalId && (
                    <p className="text-sm text-amber-600">You need to be assigned to a hospital to view patients.</p>
                  )}
                </div>
              )}
            </Card>

            {/* Transfers Section */}
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Transfers</h3>
              {dashboardData.transfers && dashboardData.transfers.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.transfers.map((transfer: any) => (
                    <div
                      key={transfer.id}
                      className="block p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {transfer.patients?.users?.full_name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {transfer.from_hospital?.full_name || 'Unknown'} → {transfer.to_hospital?.full_name || 'Unknown'}
                          </p>
                          {transfer.reason && (
                            <p className="text-sm text-slate-600 mt-1 italic">
                              Reason: {transfer.reason}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(transfer.requested_at || transfer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusIndicator status={transfer.status} transferType={transfer.transfer_type} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No active transfers</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Admin Dashboard */}
        {user.role === 'admin' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
              <p className="text-slate-600 mt-1">Manage system accounts</p>
            </div>

            <Card>
              <Link href="/dashboard/admin">
                <Button size="lg" fullWidth>Create Hospital Accounts</Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
