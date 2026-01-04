'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface CancelTransferButtonProps {
  transferId: string
  onCancel?: () => void
}

export default function CancelTransferButton({ transferId, onCancel }: CancelTransferButtonProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this transfer request? This action cannot be undone.')) {
      return
    }

    setCancelling(true)
    setError(null)

    try {
      const response = await fetch(`/api/transfers/${transferId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel transfer')
      }

      // Call optional callback
      if (onCancel) {
        onCancel()
      }

      // Refresh the page
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel transfer')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      <Button
        variant="danger"
        size="sm"
        onClick={handleCancel}
        disabled={cancelling}
      >
        {cancelling ? 'Cancelling...' : 'Cancel Transfer'}
      </Button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

