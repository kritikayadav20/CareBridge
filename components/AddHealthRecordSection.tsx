'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AddHealthRecordForm from '@/components/AddHealthRecordForm'

interface AddHealthRecordSectionProps {
  patientId: string
}

export default function AddHealthRecordSection({ patientId }: AddHealthRecordSectionProps) {
  const [isFormVisible, setIsFormVisible] = useState(false)

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Health Records</h2>
        <Button
          onClick={() => setIsFormVisible(!isFormVisible)}
          variant={isFormVisible ? 'outline' : 'primary'}
          size="lg"
        >
          {isFormVisible ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Patient Record
            </>
          )}
        </Button>
      </div>

      {isFormVisible && (
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Health Record</h3>
          <AddHealthRecordForm 
            patientId={patientId}
            onSuccess={() => setIsFormVisible(false)}
          />
        </div>
      )}
    </Card>
  )
}

