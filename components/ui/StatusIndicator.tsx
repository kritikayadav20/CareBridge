interface StatusIndicatorProps {
  status: 'requested' | 'accepted' | 'completed' | 'cancelled'
  transferType?: 'emergency' | 'non-emergency'
}

export default function StatusIndicator({ status, transferType }: StatusIndicatorProps) {
  const statusConfig = {
    requested: {
      label: 'Requested',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      dot: 'bg-gray-400'
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500'
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-800 border-green-200',
      dot: 'bg-green-500'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800 border-red-200',
      dot: 'bg-red-500'
    }
  }
  
  const typeConfig = {
    emergency: {
      label: 'Emergency',
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    'non-emergency': {
      label: 'Non-Emergency',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }
  
  const currentStatus = statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    dot: 'bg-gray-400'
  }
  const currentType = transferType ? typeConfig[transferType] : null
  
  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm ${currentStatus.color}`}>
        <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`}></span>
        {currentStatus.label}
      </div>
      {currentType && (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full border font-medium text-sm ${currentType.color}`}>
          {currentType.label}
        </span>
      )}
    </div>
  )
}

