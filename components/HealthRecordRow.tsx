'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface HealthRecord {
  id: string
  recorded_at: string
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  heart_rate: number | null
  sugar_level: number | null
}

interface HealthRecordRowProps {
  record: HealthRecord
  showActions?: boolean
}

function EditButton({ recordId }: { recordId: string }) {
  const pathname = usePathname()
  const [editUrl, setEditUrl] = useState(`/dashboard/health-records/${recordId}/edit`)

  useEffect(() => {
    // Determine edit URL based on current path
    if (pathname?.includes('/dashboard/doctor/patients/')) {
      // Extract patient ID from path like /dashboard/doctor/patients/[id]
      const pathParts = pathname.split('/')
      const patientIndex = pathParts.indexOf('patients')
      if (patientIndex !== -1 && pathParts[patientIndex + 1]) {
        const patientId = pathParts[patientIndex + 1]
        setEditUrl(`/dashboard/doctor/patients/${patientId}/health-records/${recordId}/edit`)
      }
    } else {
      setEditUrl(`/dashboard/health-records/${recordId}/edit`)
    }
  }, [pathname, recordId])

  return (
    <Link href={editUrl}>
      <Button variant="outline" size="sm">
        Edit
      </Button>
    </Link>
  )
}

export default function HealthRecordRow({ record, showActions = true }: HealthRecordRowProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this health record? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/health-records/${record.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete health record')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to delete health record')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
        {new Date(record.recorded_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {record.blood_pressure_systolic && record.blood_pressure_diastolic
          ? `${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`
          : '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {record.heart_rate ? `${record.heart_rate} bpm` : '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {record.sugar_level ? `${record.sugar_level} mg/dL` : '—'}
      </td>
      {showActions && (
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex items-center gap-2">
            <EditButton recordId={record.id} />
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </td>
      )}
    </tr>
  )
}

