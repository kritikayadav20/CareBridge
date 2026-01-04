'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import StatusIndicator from '@/components/ui/StatusIndicator'
import CancelTransferButton from '@/components/CancelTransferButton'

interface TransferCardProps {
  transfer: any
  user: any
}

export default function TransferCard({ transfer, user }: TransferCardProps) {
  const isOutgoing = user.role === 'hospital' && transfer.from_hospital_id === user.id
  const canCancel = isOutgoing && transfer.status === 'requested'

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
      <div className="flex items-start justify-between">
        <Link
          href={`/dashboard/transfers/${transfer.id}`}
          className="flex-1"
        >
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {transfer.patients?.users?.full_name || 'Unknown Patient'}
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <span className="font-medium">From:</span>{' '}
              {transfer.from_hospital?.full_name || 'Origin Hospital'}
            </div>
            <div>
              <span className="font-medium">To:</span>{' '}
              {transfer.to_hospital?.full_name || 'Destination Hospital'}
            </div>
            <div>
              <span className="font-medium">Requested:</span>{' '}
              {new Date(transfer.requested_at || transfer.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </div>
            {transfer.accepted_at && (
              <div>
                <span className="font-medium">Accepted:</span>{' '}
                {new Date(transfer.accepted_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            )}
            {transfer.completed_at && (
              <div>
                <span className="font-medium">Completed:</span>{' '}
                {new Date(transfer.completed_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            )}
            {transfer.reason && (
              <div className="md:col-span-2">
                <span className="font-medium">Reason:</span>{' '}
                <span className="text-slate-500">{transfer.reason}</span>
              </div>
            )}
          </div>
        </Link>
        <div className="ml-4 flex flex-col items-end gap-2">
          <StatusIndicator status={transfer.status} transferType={transfer.transfer_type} />
          {canCancel && (
            <CancelTransferButton transferId={transfer.id} />
          )}
        </div>
      </div>
    </Card>
  )
}

