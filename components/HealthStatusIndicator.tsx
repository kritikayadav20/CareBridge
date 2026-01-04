'use client'

import Badge from '@/components/ui/Badge'

interface HealthStatusIndicatorProps {
  type: 'blood_pressure' | 'heart_rate' | 'sugar_level'
  value: number | null
  systolic?: number | null
  diastolic?: number | null
}

export default function HealthStatusIndicator({ 
  type, 
  value, 
  systolic, 
  diastolic 
}: HealthStatusIndicatorProps) {
  const getStatus = () => {
    if (type === 'blood_pressure') {
      if (!systolic || !diastolic) return { status: 'unknown', label: 'No Data', color: 'gray' }
      
      // Blood Pressure Categories (mmHg)
      if (systolic < 120 && diastolic < 80) {
        return { status: 'normal', label: 'Normal', color: 'green' }
      } else if (systolic < 130 && diastolic < 80) {
        return { status: 'elevated', label: 'Elevated', color: 'yellow' }
      } else if (systolic < 140 || diastolic < 90) {
        return { status: 'high_stage1', label: 'High (Stage 1)', color: 'orange' }
      } else if (systolic < 180 || diastolic < 120) {
        return { status: 'high_stage2', label: 'High (Stage 2)', color: 'red' }
      } else {
        return { status: 'crisis', label: 'Crisis', color: 'red' }
      }
    }
    
    if (type === 'heart_rate') {
      if (!value) return { status: 'unknown', label: 'No Data', color: 'gray' }
      
      // Heart Rate Categories (bpm)
      if (value < 60) {
        return { status: 'low', label: 'Low (Bradycardia)', color: 'blue' }
      } else if (value >= 60 && value <= 100) {
        return { status: 'normal', label: 'Normal', color: 'green' }
      } else if (value <= 120) {
        return { status: 'elevated', label: 'Elevated', color: 'yellow' }
      } else {
        return { status: 'high', label: 'High (Tachycardia)', color: 'red' }
      }
    }
    
    if (type === 'sugar_level') {
      if (!value) return { status: 'unknown', label: 'No Data', color: 'gray' }
      
      // Blood Sugar Categories (mg/dL) - Fasting
      if (value < 70) {
        return { status: 'low', label: 'Low (Hypoglycemia)', color: 'red' }
      } else if (value < 100) {
        return { status: 'normal', label: 'Normal', color: 'green' }
      } else if (value < 126) {
        return { status: 'prediabetic', label: 'Prediabetic', color: 'yellow' }
      } else {
        return { status: 'high', label: 'High (Diabetes)', color: 'red' }
      }
    }
    
    return { status: 'unknown', label: 'Unknown', color: 'gray' }
  }

  const { status, label, color } = getStatus()

  const colorMap = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const getBadgeVariant = () => {
    if (color === 'green') return 'success'
    if (color === 'yellow') return 'warning'
    if (color === 'red' || color === 'orange') return 'danger'
    if (color === 'blue') return 'info'
    return 'neutral'
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getBadgeVariant() as any}>
        {label}
      </Badge>
      <span className="text-sm text-slate-600">
        {type === 'blood_pressure' && systolic && diastolic
          ? `${systolic}/${diastolic} mmHg`
          : type === 'heart_rate' && value
          ? `${value} bpm`
          : type === 'sugar_level' && value
          ? `${value} mg/dL`
          : ''}
      </span>
    </div>
  )
}

