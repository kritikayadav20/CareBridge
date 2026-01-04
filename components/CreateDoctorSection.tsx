'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CreateDoctorForm from '@/components/CreateDoctorForm'

export default function CreateDoctorSection() {
  const [isFormVisible, setIsFormVisible] = useState(false)

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Doctor Management</h2>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage doctors at your hospital
          </p>
        </div>
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
              Create Doctor Account
            </>
          )}
        </Button>
      </div>

      {isFormVisible && (
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create Doctor Account</h3>
          <p className="text-sm text-slate-600 mb-4">
            Create a new doctor account that will be associated with your hospital.
          </p>
          <CreateDoctorForm onSuccess={() => setIsFormVisible(false)} />
        </div>
      )}
    </Card>
  )
}

