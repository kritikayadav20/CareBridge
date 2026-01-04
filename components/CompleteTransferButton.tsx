'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface CompleteTransferButtonProps {
  transferId: string
}

export default function CompleteTransferButton({ transferId }: CompleteTransferButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async () => {
    if (!confirm('Are you sure you want to mark this transfer as completed? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Verify user is a hospital or doctor
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || (userData.role !== 'hospital' && userData.role !== 'doctor')) {
        throw new Error('Only hospitals and doctors can complete transfers')
      }

      // Get transfer details to verify
      const { data: transfer } = await supabase
        .from('transfers')
        .select('status, to_hospital_id, from_hospital_id')
        .eq('id', transferId)
        .single()

      if (!transfer) {
        throw new Error('Transfer not found')
      }

      // Verify transfer is in accepted status
      if (transfer.status !== 'accepted') {
        throw new Error(`Transfer cannot be completed. Current status: ${transfer.status}`)
      }

      // Verify user is involved in the transfer (hospital must be from or to hospital)
      if (userData.role === 'hospital') {
        if (transfer.to_hospital_id !== user.id && transfer.from_hospital_id !== user.id) {
          throw new Error('You are not authorized to complete this transfer')
        }
      }

      // Update transfer status
      const { error: updateError } = await supabase
        .from('transfers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transferId)
        .eq('status', 'accepted') // Ensure it's still accepted

      if (updateError) throw updateError

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to complete transfer')
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
        onClick={handleComplete}
        disabled={loading}
        variant="success"
        size="lg"
        fullWidth
      >
        {loading ? 'Completing Transfer...' : 'Complete Transfer'}
      </Button>
      <p className="mt-2 text-xs text-slate-500 text-center">
        Mark this transfer as completed when the patient has been successfully transferred
      </p>
    </div>
  )
}

