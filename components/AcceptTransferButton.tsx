'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface AcceptTransferButtonProps {
  transferId: string
}

export default function AcceptTransferButton({ transferId }: AcceptTransferButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to accept this transfer? This will grant access to patient health data.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Verify user is a hospital
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'hospital') {
        throw new Error('Only hospitals can accept transfers')
      }

      // Get transfer details to verify and update
      const { data: transfer } = await supabase
        .from('transfers')
        .select('patient_id, to_hospital_id, status')
        .eq('id', transferId)
        .single()

      if (!transfer) {
        throw new Error('Transfer not found')
      }

      // Verify this is the receiving hospital
      if (transfer.to_hospital_id !== user.id) {
        throw new Error('Only the receiving hospital can accept this transfer')
      }

      // Verify transfer is in requested status
      if (transfer.status !== 'requested') {
        throw new Error(`Transfer cannot be accepted. Current status: ${transfer.status}`)
      }

      // Update transfer status
      const { error: updateError } = await supabase
        .from('transfers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', transferId)
        .eq('status', 'requested') // Ensure it's still requested

      if (updateError) throw updateError

      // Update patient's current hospital (admit to receiving hospital)
      const { error: patientUpdateError } = await supabase
        .from('patients')
        .update({
          current_hospital_id: transfer.to_hospital_id,
        })
        .eq('id', transfer.patient_id)

      if (patientUpdateError) {
        console.error('Error updating patient hospital:', patientUpdateError)
        // Don't throw - transfer is accepted, patient update can be retried
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to accept transfer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <Button
        onClick={handleAccept}
        disabled={loading}
        variant="secondary"
        size="lg"
        fullWidth
      >
        {loading ? 'Accepting Transfer...' : 'Accept Transfer'}
      </Button>
      <p className="mt-2 text-xs text-slate-500 text-center">
        Accepting will grant access to patient health records and medical reports
      </p>
    </div>
  )
}

