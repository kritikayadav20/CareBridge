import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TransferChat from '@/components/TransferChat'
import AcceptTransferButton from '@/components/AcceptTransferButton'
import CompleteTransferButton from '@/components/CompleteTransferButton'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import TransferSteps from '@/components/ui/TransferSteps'

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // Handle Next.js 15+ params (can be a Promise)
  const resolvedParams = await Promise.resolve(params)
  const transferId = resolvedParams.id

  if (!transferId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <p className="text-slate-600">Invalid transfer ID</p>
        </Card>
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch transfer data separately to avoid relationship issues
  const { data: transferData, error: transferError } = await supabase
    .from('transfers')
    .select('*')
    .eq('id', transferId)
    .single()

  if (transferError || !transferData) {
    console.error('Error fetching transfer:', transferError)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <p className="text-slate-600">Transfer not found</p>
          {transferError && (
            <p className="text-xs text-slate-500 mt-2">{transferError.message}</p>
          )}
        </Card>
      </div>
    )
  }

  // Fetch patient data
  let patientData: any = null
  if (transferData.patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('id, user_id')
      .eq('id', transferData.patient_id)
      .single()

    if (patient?.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', patient.user_id)
        .single()

      patientData = {
        ...patient,
        users: userData || null
      }
    }
  }

  // Fetch hospital data
  let fromHospital: any = null
  let toHospital: any = null

  if (transferData.from_hospital_id) {
    const { data: hospital } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', transferData.from_hospital_id)
      .eq('role', 'hospital')
      .single()
    fromHospital = hospital
  }

  if (transferData.to_hospital_id) {
    const { data: hospital } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', transferData.to_hospital_id)
      .eq('role', 'hospital')
      .single()
    toHospital = hospital
  }

  // Combine all data
  const transfer = {
    ...transferData,
    patients: patientData,
    from_hospital: fromHospital,
    to_hospital: toHospital,
  }

  // Check access
  const hasAccess = 
    user.role === 'patient' && transfer.patients?.user_id === user.id ||
    user.role === 'hospital' && (transfer.to_hospital_id === user.id || transfer.from_hospital_id === user.id) ||
    user.role === 'doctor' && (transfer.status === 'accepted' || transfer.status === 'completed')

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <p className="text-red-600">Access denied</p>
        </Card>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
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

      <div className="container mx-auto px-4 py-8">
        {/* Transfer Status Steps */}
        <Card className="mb-6">
          <TransferSteps currentStep={transfer.status} />
        </Card>

        {/* Transfer Overview */}
        <Card className="mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Patient Transfer details</h1>
              <p className="text-slate-600">Transfer ID: {transfer.id.slice(0, 8)}...</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={transfer.transfer_type === 'emergency' ? 'danger' : 'info'}>
                {transfer.transfer_type === 'emergency' ? 'Emergency' : 'Non-Emergency'}
              </Badge>
              <Badge variant={transfer.status === 'completed' ? 'success' : transfer.status === 'accepted' ? 'info' : 'neutral'}>
                {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Patient</p>
              <p className="text-lg font-semibold text-slate-900">
                {transfer.patients?.users?.full_name || 'Unknown Patient'}
              </p>
              <p className="text-sm text-slate-600 mt-1">{transfer.patients?.users?.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Transfer Route</p>
              <p className="text-lg font-semibold text-slate-900">
                {transfer.from_hospital?.full_name || 'Origin Hospital'} → {transfer.to_hospital?.full_name || 'Destination Hospital'}
              </p>
            </div>
          </div>

          {/* Timestamp Tracking */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-1">Requested At</p>
              <p className="text-sm font-semibold text-blue-900">
                {new Date(transfer.requested_at || transfer.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
            {transfer.accepted_at && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-medium text-green-700 mb-1">Accepted At</p>
                <p className="text-sm font-semibold text-green-900">
                  {new Date(transfer.accepted_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}
            {transfer.completed_at && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-xs font-medium text-teal-700 mb-1">Completed At</p>
                <p className="text-sm font-semibold text-teal-900">
                  {new Date(transfer.completed_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}
          </div>

          {transfer.reason && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Transfer Reason</p>
              <p className="text-sm text-blue-800">{transfer.reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
            {user.role === 'hospital' && transfer.to_hospital_id === user.id && transfer.status === 'requested' && (
              <AcceptTransferButton transferId={transfer.id} />
            )}
            {(user.role === 'hospital' || user.role === 'doctor') && 
             transfer.status === 'accepted' && 
             (transfer.to_hospital_id === user.id || transfer.from_hospital_id === user.id) && (
              <CompleteTransferButton transferId={transfer.id} />
            )}
          </div>
        </Card>

        {/* View Patient Records Button - Only visible after acceptance */}
        {(transfer.status === 'accepted' || transfer.status === 'completed') && (
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Patient Records</h3>
                <p className="text-sm text-slate-600">
                  View complete health records and medical reports for this patient
                </p>
              </div>
              <Link href={`/dashboard/hospital/patients/${transfer.patient_id}`}>
                <Button size="lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Patient Records
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Transfer Coordination Chat */}
        <Card className="mt-6">
          <TransferChat transferId={transfer.id} />
        </Card>
      </div>
    </div>
  )
}
