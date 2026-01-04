import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, role } = body

    // Only allow patient signup via public signup
    // Hospitals and doctors are created by admin/hospitals
    if (role !== 'patient') {
      return NextResponse.json(
        { error: 'Only patients can self-register. Hospital and doctor accounts are created by system administrators.' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Create user profile using database function (bypasses RLS)
    // First try direct insert, if that fails use the function
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        role: role,
        full_name: fullName,
        phone: phone || null,
      })

    // If direct insert fails due to RLS, try using the database function
    if (profileError && profileError.message.includes('row-level security')) {
      const { error: functionError } = await supabase.rpc('create_user_profile', {
        p_user_id: authData.user.id,
        p_email: email,
        p_role: role,
        p_full_name: fullName,
        p_phone: phone || null,
      })

      if (functionError) {
        return NextResponse.json(
          { error: functionError.message || 'Failed to create profile' },
          { status: 400 }
        )
      }
    } else if (profileError) {
      return NextResponse.json(
        { error: profileError.message || 'Failed to create profile' },
        { status: 400 }
      )
    }

    // If patient, create patient record
    if (role === 'patient') {
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: authData.user.id,
        })

      // If direct insert fails due to RLS, try using the database function
      if (patientError && patientError.message.includes('row-level security')) {
        const { error: functionError } = await supabase.rpc('create_patient_record', {
          p_user_id: authData.user.id,
        })

        if (functionError) {
          return NextResponse.json(
            { error: functionError.message || 'Failed to create patient record' },
            { status: 400 }
          )
        }
      } else if (patientError) {
        return NextResponse.json(
          { error: patientError.message || 'Failed to create patient record' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      user: authData.user 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sign up' },
      { status: 500 }
    )
  }
}

