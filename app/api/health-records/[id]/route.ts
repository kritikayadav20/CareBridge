import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Next.js 15+ params (can be a Promise)
    const resolvedParams = await Promise.resolve(params)
    const recordId = resolvedParams.id

    if (!recordId) {
      return NextResponse.json(
        { error: 'Health record ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role, hospital_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the health record to find the patient
    const { data: record, error: recordError } = await supabase
      .from('health_records')
      .select('id, patient_id')
      .eq('id', recordId)
      .single()

    if (recordError) {
      console.error('Error fetching health record:', recordError)
      return NextResponse.json(
        { error: `Health record not found: ${recordError.message}` },
        { status: 404 }
      )
    }

    if (!record) {
      return NextResponse.json(
        { error: 'Health record not found' },
        { status: 404 }
      )
    }

    // Verify access based on role
    if (userData.role === 'patient') {
      // Patient: verify the health record belongs to this patient
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patient || patient.id !== record.patient_id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (userData.role === 'doctor') {
      // Doctor: verify patient is at the doctor's hospital
      const { data: patient } = await supabase
        .from('patients')
        .select('current_hospital_id')
        .eq('id', record.patient_id)
        .single()

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        )
      }

      if (patient.current_hospital_id !== userData.hospital_id) {
        return NextResponse.json(
          { error: 'Access denied. Patient is not at your hospital.' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Only patients and doctors can delete health records' },
        { status: 403 }
      )
    }

    // Delete the health record
    const { error: deleteError } = await supabase
      .from('health_records')
      .delete()
      .eq('id', recordId)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete health record' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Health record deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

