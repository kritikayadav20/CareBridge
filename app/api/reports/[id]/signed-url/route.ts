import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Next.js 15+ params (can be a Promise)
    const resolvedParams = await Promise.resolve(params)
    const reportId = resolvedParams.id

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role and hospital_id if doctor
    const userResult = await supabase
      .from('users')
      .select('role, hospital_id')
      .eq('id', user.id)
      .single() as { data: { role: string; hospital_id: string | null } | null }
    const userData = userResult.data

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch the medical report to get patient_id and file_url (path)
    const reportResult = await supabase
      .from('medical_reports')
      .select('id, patient_id, file_url')
      .eq('id', reportId)
      .single() as { data: { id: string; patient_id: string; file_url: string } | null; error: any }
    const report = reportResult.data
    const reportError = reportResult.error

    if (reportError || !report) {
      console.error('Error fetching medical report:', reportError)
      return NextResponse.json(
        { error: 'Medical report not found' },
        { status: 404 }
      )
    }

    // Fetch patient details to check current_hospital_id
    const patientResult = await supabase
      .from('patients')
      .select('id, user_id, current_hospital_id')
      .eq('id', report.patient_id)
      .single() as { data: { id: string; user_id: string; current_hospital_id: string | null } | null; error: any }
    const patient = patientResult.data
    const patientError = patientResult.error

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found for this report' },
        { status: 404 }
      )
    }

    // Access control logic
    let hasAccess = false
    if (userData.role === 'patient' && patient.user_id === user.id) {
      hasAccess = true // Patient can view their own reports
    } else if (userData.role === 'hospital' && patient.current_hospital_id === user.id) {
      hasAccess = true // Hospital can view reports for admitted patients
    } else if (userData.role === 'doctor' && patient.current_hospital_id === userData.hospital_id) {
      hasAccess = true // Doctor can view reports for patients at their hospital
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this medical report' },
        { status: 403 }
      )
    }

    // Validate file_url exists
    if (!report.file_url) {
      console.error('Report file_url is missing:', report)
      return NextResponse.json(
        { error: 'Report file path is missing' },
        { status: 400 }
      )
    }

    // Clean the file path - remove any leading slashes or bucket name
    let cleanPath = report.file_url.trim()
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1)
    }
    // Remove bucket name if it's included in the path
    if (cleanPath.startsWith('medical-reports/')) {
      cleanPath = cleanPath.substring('medical-reports/'.length)
    }

    console.log('Generating signed URL for path:', cleanPath, 'original:', report.file_url)

    // Generate signed URL using server-side client (better permissions)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('medical-reports')
      .createSignedUrl(cleanPath, 3600) // 1 hour expiry

    if (signedUrlError) {
      console.error('Storage error details:', {
        error: signedUrlError,
        originalPath: report.file_url,
        cleanPath,
        bucket: 'medical-reports'
      })
      return NextResponse.json(
        { error: `Failed to generate signed URL: ${signedUrlError.message}` },
        { status: 500 }
      )
    }

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL: No URL returned' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { signedUrl: signedUrlData.signedUrl },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

