interface StatusIndicatorProps {
  status: 'requested' | 'accepted' | 'completed' | 'cancelled'
  transferType?: 'emergency' | 'non-emergency'
}

export default function StatusIndicator({ status, transferType }: StatusIndicatorProps) {
  const statusConfig = {
    requested: {
      label: 'Requested',
      color: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400'
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      dot: 'bg-blue-500'
    },
    completed: {
      label: 'Completed',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-50 text-red-600 border-red-200',
      dot: 'bg-red-500'
    }
  }

  const typeConfig = {
    emergency: {
      label: 'Emergency',
      color: 'bg-pink-50 text-pink-600 border-pink-200'
    },
    'non-emergency': {
      label: 'Non-Emergency',
      color: 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const currentStatus = statusConfig[status] || {
    label: status,
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400'
  }
  const currentType = transferType ? typeConfig[transferType] : null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${currentStatus.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`}></span>
        {currentStatus.label}
      </div>
      {currentType && (
        <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium ${currentType.color}`}>
          {currentType.label}
        </span>
      )}
    </div>
  )
}
