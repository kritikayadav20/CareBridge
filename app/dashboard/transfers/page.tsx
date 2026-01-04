import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import TransferCard from '@/components/TransferCard'

export default async function TransfersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  let transfers: any[] = []

  if (user.role === 'patient') {
    const { data } = await supabase
      .from('transfers')
      .select('*, patients!inner(user_id), to_hospital:users!transfers_to_hospital_id_fkey(*), from_hospital:users!transfers_from_hospital_id_fkey(*)')
      .eq('patients.user_id', user.id)
      .order('created_at', { ascending: false })

    transfers = data || []
  } else if (user.role === 'hospital') {
    // Fetch incoming transfers - fetch transfers first, then related data separately
    const { data: incomingTransfers, error: incomingError } = await supabase
      .from('transfers')
      .select('*')
      .eq('to_hospital_id', user.id)
      .order('created_at', { ascending: false })

    if (incomingError) {
      console.error('Error fetching incoming transfers:', incomingError)
    }

    // Fetch outgoing transfers
    const { data: outgoingTransfers, error: outgoingError } = await supabase
      .from('transfers')
      .select('*')
      .eq('from_hospital_id', user.id)
      .order('created_at', { ascending: false })

    if (outgoingError) {
      console.error('Error fetching outgoing transfers:', outgoingError)
    }

    // Collect all unique IDs needed
    const patientIds = new Set<string>()
    const hospitalIds = new Set<string>()
    
    ;(incomingTransfers || []).forEach(t => {
      if (t.patient_id) patientIds.add(t.patient_id)
      if (t.from_hospital_id) hospitalIds.add(t.from_hospital_id)
      if (t.to_hospital_id) hospitalIds.add(t.to_hospital_id)
    })
    
    ;(outgoingTransfers || []).forEach(t => {
      if (t.patient_id) patientIds.add(t.patient_id)
      if (t.from_hospital_id) hospitalIds.add(t.from_hospital_id)
      if (t.to_hospital_id) hospitalIds.add(t.to_hospital_id)
    })

    // Fetch patient data
    let patientMap: Record<string, any> = {}
    if (patientIds.size > 0) {
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, user_id')
        .in('id', Array.from(patientIds))

      if (patientsError) {
        console.error('Error fetching patients:', patientsError)
      } else if (patientsData) {
        const userIds = patientsData.map(p => p.user_id).filter(Boolean)
        
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', userIds)

          if (usersError) {
            console.error('Error fetching users:', usersError)
          } else if (usersData) {
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

    // Fetch hospital details
    let hospitalMap: Record<string, any> = {}
    if (hospitalIds.size > 0) {
      const { data: hospitalsData, error: hospitalsError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', Array.from(hospitalIds))
        .eq('role', 'hospital')

      if (hospitalsError) {
        console.error('Error fetching hospitals:', hospitalsError)
      } else if (hospitalsData) {
        hospitalsData.forEach(h => {
          hospitalMap[h.id] = h
        })
      }
    }

    // Combine transfers with related data
    transfers = [
      ...(incomingTransfers || []).map(t => ({
        ...t,
        patients: patientMap[t.patient_id] || null,
        from_hospital: hospitalMap[t.from_hospital_id] || null,
        to_hospital: hospitalMap[t.to_hospital_id] || null,
      })),
      ...(outgoingTransfers || []).map(t => ({
        ...t,
        patients: patientMap[t.patient_id] || null,
        from_hospital: hospitalMap[t.from_hospital_id] || null,
        to_hospital: hospitalMap[t.to_hospital_id] || null,
      }))
    ]

    // Sort by created_at descending
    transfers.sort((a, b) => {
      const dateA = new Date(a.created_at || a.requested_at || 0).getTime()
      const dateB = new Date(b.created_at || b.requested_at || 0).getTime()
      return dateB - dateA
    })
  } else if (user.role === 'doctor') {
    // Get doctor's hospital_id
    const { data: doctorData } = await supabase
      .from('users')
      .select('hospital_id')
      .eq('id', user.id)
      .single()

    if (doctorData?.hospital_id) {
      // Fetch incoming transfers (to this hospital)
      const { data: incomingTransfers, error: incomingError } = await supabase
        .from('transfers')
        .select('*')
        .eq('to_hospital_id', doctorData.hospital_id)
        .in('status', ['requested', 'accepted', 'completed'])
        .order('created_at', { ascending: false })

      if (incomingError) {
        console.error('Error fetching incoming transfers:', incomingError)
      }

      // Fetch outgoing transfers (from this hospital)
      const { data: outgoingTransfers, error: outgoingError } = await supabase
        .from('transfers')
        .select('*')
        .eq('from_hospital_id', doctorData.hospital_id)
        .in('status', ['requested', 'accepted', 'completed'])
        .order('created_at', { ascending: false })

      if (outgoingError) {
        console.error('Error fetching outgoing transfers:', outgoingError)
      }

      // Collect all unique IDs needed
      const patientIds = new Set<string>()
      const hospitalIds = new Set<string>()
      
      ;(incomingTransfers || []).forEach(t => {
        if (t.patient_id) patientIds.add(t.patient_id)
        if (t.from_hospital_id) hospitalIds.add(t.from_hospital_id)
        if (t.to_hospital_id) hospitalIds.add(t.to_hospital_id)
      })
      
      ;(outgoingTransfers || []).forEach(t => {
        if (t.patient_id) patientIds.add(t.patient_id)
        if (t.from_hospital_id) hospitalIds.add(t.from_hospital_id)
        if (t.to_hospital_id) hospitalIds.add(t.to_hospital_id)
      })

      // Fetch patient data
      let patientMap: Record<string, any> = {}
      if (patientIds.size > 0) {
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id, user_id')
          .in('id', Array.from(patientIds))

        if (patientsError) {
          console.error('Error fetching patients:', patientsError)
        } else if (patientsData) {
          const userIds = patientsData.map(p => p.user_id).filter(Boolean)
          
          if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id, full_name, email')
              .in('id', userIds)

            if (usersError) {
              console.error('Error fetching users:', usersError)
            } else if (usersData) {
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

      // Fetch hospital details
      let hospitalMap: Record<string, any> = {}
      if (hospitalIds.size > 0) {
        const { data: hospitalsData, error: hospitalsError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', Array.from(hospitalIds))
          .eq('role', 'hospital')

        if (hospitalsError) {
          console.error('Error fetching hospitals:', hospitalsError)
        } else if (hospitalsData) {
          hospitalsData.forEach(h => {
            hospitalMap[h.id] = h
          })
        }
      }

      // Combine transfers with related data
      transfers = [
        ...(incomingTransfers || []).map(t => ({
          ...t,
          patients: patientMap[t.patient_id] || null,
          from_hospital: hospitalMap[t.from_hospital_id] || null,
          to_hospital: hospitalMap[t.to_hospital_id] || null,
        })),
        ...(outgoingTransfers || []).map(t => ({
          ...t,
          patients: patientMap[t.patient_id] || null,
          from_hospital: hospitalMap[t.from_hospital_id] || null,
          to_hospital: hospitalMap[t.to_hospital_id] || null,
        }))
      ]

      // Sort by created_at descending
      transfers.sort((a, b) => {
        const dateA = new Date(a.created_at || a.requested_at || 0).getTime()
        const dateB = new Date(b.created_at || b.requested_at || 0).getTime()
        return dateB - dateA
      })
    }
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
            <h1 className="text-3xl font-bold text-slate-900">Patient Transfers</h1>
            <p className="text-slate-600 mt-1">Manage and track patient transfers between hospitals</p>
          </div>
          {user.role === 'hospital' && (
            <Link href="/dashboard/transfers/new">
              <Button size="lg">Request New Transfer</Button>
            </Link>
          )}
        </div>

        {transfers.length > 0 ? (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <TransferCard key={transfer.id} transfer={transfer} user={user} />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No transfers found</h3>
              <p className="text-slate-600 mb-6">
                {user.role === 'hospital' 
                  ? 'Start by requesting a patient transfer'
                  : 'No transfer history available'}
              </p>
              {user.role === 'hospital' && (
                <Link href="/dashboard/transfers/new">
                  <Button size="lg">Request Transfer</Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
