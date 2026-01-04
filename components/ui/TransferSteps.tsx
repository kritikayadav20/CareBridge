interface TransferStepsProps {
  currentStep: 'requested' | 'accepted' | 'completed'
}

export default function TransferSteps({ currentStep }: TransferStepsProps) {
  const steps = [
    { key: 'requested', label: 'Requested', status: currentStep === 'requested' ? 'current' : currentStep === 'accepted' || currentStep === 'completed' ? 'completed' : 'pending' },
    { key: 'accepted', label: 'Accepted', status: currentStep === 'accepted' ? 'current' : currentStep === 'completed' ? 'completed' : 'pending' },
    { key: 'completed', label: 'Completed', status: currentStep === 'completed' ? 'current' : 'pending' }
  ]
  
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg border-2 ${
              step.status === 'completed' 
                ? 'bg-green-500 text-white border-green-500' 
                : step.status === 'current'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-400 border-gray-300'
            }`}>
              {step.status === 'completed' ? '✓' : index + 1}
            </div>
            <p className={`mt-2 text-sm font-medium ${
              step.status === 'completed' || step.status === 'current'
                ? 'text-gray-900'
                : 'text-gray-400'
            }`}>
              {step.label}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${
              step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
          )}
        </div>
      ))}
    </div>
  )
}

