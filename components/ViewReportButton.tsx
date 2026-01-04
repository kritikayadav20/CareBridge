'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface ViewReportButtonProps {
  reportId: string
  reportName: string
  variant?: 'link' | 'button'
  size?: 'sm' | 'md' | 'lg'
}

export default function ViewReportButton({ 
  reportId, 
  reportName,
  variant = 'link',
  size = 'sm'
}: ViewReportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleView = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports/${reportId}/signed-url`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate access link')
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      setError(err.message || 'Failed to open report')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'button') {
    return (
      <div>
        <Button
          onClick={handleView}
          disabled={loading}
          variant="outline"
          size={size}
        >
          {loading ? 'Loading...' : 'View Report'}
        </Button>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleView}
        disabled={loading}
        className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : 'View Report'}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

