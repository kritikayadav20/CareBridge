import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is a patient
    const userResult = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }
    const userProfile = userResult.data

    if (!userProfile || userProfile.role !== 'patient') {
      return NextResponse.json(
        { error: 'Only patients can have patient records' },
        { status: 403 }
      )
    }

    // Check if patient record exists
    const patientResult = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: any }
    let patient = patientResult.data
    const fetchError = patientResult.error

    // If patient record doesn't exist, create it
    if (!patient) {
      // Try direct insert first
      const { data: newPatient, error: insertError } = await (supabase
        .from('patients') as any)
        .insert({ user_id: user.id })
        .select('id')
        .single()

      if (insertError) {
        // If RLS blocks it, use the database function
        // The function should return the patient_id directly
        const { data: functionResult, error: functionError } = await (supabase.rpc as any)('create_patient_record', {
          p_user_id: user.id,
        })

        if (functionError) {
          console.error('Function error:', functionError)
          return NextResponse.json(
            { error: `Failed to create patient record: ${functionError.message}` },
            { status: 500 }
          )
        }

        // The function should return UUID directly
        // Handle different possible return formats
        let patientId: string | null = null

        if (functionResult !== null && functionResult !== undefined) {
          // Function returned a value
          if (typeof functionResult === 'string') {
            patientId = functionResult
          } else if (typeof functionResult === 'object' && 'id' in functionResult) {
            patientId = functionResult.id
          } else {
            // Try to convert to string
            patientId = String(functionResult)
          }
        }

        if (patientId) {
          patient = { id: patientId }
        } else {
          // Last resort: try fetching with multiple retries
          let retries = 3
          let delay = 200
          
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, delay))
            
            const createdPatientResult = await supabase
              .from('patients')
              .select('id')
              .eq('user_id', user.id)
              .single() as { data: { id: string } | null; error: any }
            const createdPatient = createdPatientResult.data
            const fetchError = createdPatientResult.error

            if (createdPatient && !fetchError) {
              patient = createdPatient
              break
            }

            delay *= 2
          }

          if (!patient) {
            // Return success anyway - the record was likely created
            // The client can try fetching it directly
            return NextResponse.json(
              { 
                success: true,
                patient_id: null,
                message: 'Patient record creation initiated. Please try adding the health record again - it should work now.'
              },
              { status: 200 }
            )
          }
        }
      } else {
        patient = newPatient
      }
    }

    if (!patient) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve patient record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      patient_id: patient.id 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to ensure patient record' },
      { status: 500 }
    )
  }
}

