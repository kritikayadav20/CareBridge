'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadMedicalReport } from '@/lib/storage'
import { MedicalReport } from '@/types'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ViewReportButton from '@/components/ViewReportButton'

interface PatientReportsManagerProps {
  patientId: string
}

export default function PatientReportsManager({ patientId }: PatientReportsManagerProps) {
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    reportName: '',
    reportType: '',
    file: null as File | null,
  })

  useEffect(() => {
    loadReports()
  }, [patientId])

  const loadReports = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: reportsData, error: reportsError } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false })

      if (reportsError) {
        throw reportsError
      }

      if (reportsData) {
        setReports(reportsData)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.reportName) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload file and get file path (not public URL)
      const filePath = await uploadMedicalReport(
        uploadForm.file,
        patientId,
        uploadForm.reportName
      )

      const { error: insertError } = await supabase
        .from('medical_reports')
        .insert({
          patient_id: patientId,
          report_name: uploadForm.reportName,
          file_url: filePath, // Store file path, not public URL
          report_type: uploadForm.reportType || null,
        })

      if (insertError) throw insertError

      setSuccess('Report uploaded successfully!')
      setShowUpload(false)
      setUploadForm({ reportName: '', reportType: '', file: null })
      
      // Reload reports
      await loadReports()
    } catch (err: any) {
      setError(err.message || 'Failed to upload report')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Medical Reports</h2>
          <p className="text-slate-600 mt-1">Upload and manage patient medical reports</p>
        </div>
        <Button
          onClick={() => {
            setShowUpload(!showUpload)
            if (showUpload) {
              setUploadForm({ reportName: '', reportType: '', file: null })
              setError(null)
              setSuccess(null)
            }
          }}
          variant={showUpload ? 'outline' : 'primary'}
          size="lg"
        >
          {showUpload ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Report
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {showUpload && (
        <Card>
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Upload Medical Report</h3>
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label htmlFor="reportName" className="block text-sm font-medium text-slate-700 mb-2">
                Report Name <span className="text-red-500">*</span>
              </label>
              <input
                id="reportName"
                type="text"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                value={uploadForm.reportName}
                onChange={(e) => setUploadForm({ ...uploadForm, reportName: e.target.value })}
                placeholder="e.g., Blood Test Results"
              />
            </div>
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-slate-700 mb-2">
                Report Type <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="reportType"
                type="text"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                value={uploadForm.reportType}
                onChange={(e) => setUploadForm({ ...uploadForm, reportType: e.target.value })}
                placeholder="e.g., Lab Report, X-Ray, MRI, CT Scan"
              />
            </div>
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-slate-700 mb-2">
                File <span className="text-red-500">*</span>
              </label>
              <input
                id="file"
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              />
              <p className="mt-1 text-xs text-slate-500">
                Supported formats: PDF, Images (JPG, PNG), Documents (DOC, DOCX)
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={uploading || !uploadForm.file || !uploadForm.reportName}
                size="lg"
                fullWidth
              >
                {uploading ? 'Uploading...' : 'Upload Report'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUpload(false)
                  setUploadForm({ reportName: '', reportType: '', file: null })
                  setError(null)
                  setSuccess(null)
                }}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Reports List */}
      {reports.length > 0 ? (
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">All Reports</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {report.report_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {report.report_type || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(report.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <ViewReportButton reportId={report.id} reportName={report.report_name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No medical reports yet</h3>
            <p className="text-slate-600">Upload the first report for this patient</p>
          </div>
        </Card>
      )}
    </div>
  )
}

