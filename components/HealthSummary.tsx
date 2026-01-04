'use client'

import { useState } from 'react'
import { HealthRecord } from '@/types'
import Button from '@/components/ui/Button'

interface HealthSummaryProps {
  records: HealthRecord[]
}

export default function HealthSummary({ records }: HealthSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (records.length === 0) {
      setError('No health records available for analysis')
      return
    }

    setLoading(true)
    setError(null)
    setSummary(null) // Clear previous summary when generating new one
    
    try {
      // Prepare vitals data with proper structure
      const vitals = {
        bloodPressure: records
          .filter(r => r.blood_pressure_systolic && r.blood_pressure_diastolic)
          .map(r => ({
            systolic: r.blood_pressure_systolic!,
            diastolic: r.blood_pressure_diastolic!,
          })),
        heartRate: records
          .filter(r => r.heart_rate)
          .map(r => r.heart_rate!),
        sugarLevel: records
          .filter(r => r.sugar_level)
          .map(r => Number(r.sugar_level!)),
        timestamps: records.map(r => r.recorded_at),
      }

      // Only fetch if we have at least one vital sign
      if (vitals.bloodPressure.length === 0 && vitals.heartRate.length === 0 && vitals.sugarLevel.length === 0) {
        setError('No vital signs data available for analysis')
        setLoading(false)
        return
      }

      const response = await fetch('/api/health-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vitals }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err: any) {
      console.error('Error fetching health summary:', err)
      setError(err.message || 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">Add health records to generate an AI-powered summary</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!summary && !loading && (
        <div className="text-center py-6">
          <Button
            onClick={handleGenerate}
            size="lg"
            className="inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Generate AI Health Summary
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Generating AI health summary...</p>
            <p className="text-xs text-blue-700 mt-0.5">Analyzing your vital signs with Google Cloud Gemini</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Unable to generate summary</p>
              <p className="text-sm text-amber-700 mt-1">{error}</p>
              <div className="mt-3">
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {summary && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-slate-900">AI Health Summary</h3>
            <Button
              onClick={handleGenerate}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </Button>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {summary.split('\n').map((paragraph, idx) => (
                paragraph.trim() && (
                  <p key={idx} className="mb-4 last:mb-0">
                    {paragraph.trim()}
                  </p>
                )
              ))}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-700 mb-1">Important Disclaimer</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This AI-generated summary is powered by Google Cloud Gemini and is provided for informational purposes only. 
                  It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of 
                  qualified healthcare providers with any questions you may have regarding a medical condition. Never disregard 
                  professional medical advice or delay in seeking it because of information provided here.
                </p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  Generated by Google Cloud Gemini • {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

