import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is a hospital
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'hospital') {
      return NextResponse.json(
        { error: 'Forbidden: Hospital access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, fullName, phone } = body

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    
    // Basic email format check
    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: `An account with email ${normalizedEmail} already exists` },
        { status: 400 }
      )
    }

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    })

    if (authError) {
      let errorMessage = authError.message
      
      if (authError.message.includes('already registered')) {
        errorMessage = `Email ${normalizedEmail} is already registered. Please use a different email.`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? authError.message : undefined
        },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Create user profile with doctor role and link to hospital
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: normalizedEmail,
        role: 'doctor',
        full_name: fullName,
        phone: phone || null,
        hospital_id: authUser.id, // Link doctor to this hospital
      })

    // If direct insert fails due to RLS, try using the database function
    if (profileError && profileError.message.includes('row-level security')) {
      const { error: functionError } = await supabase.rpc('create_user_profile', {
        p_user_id: authData.user.id,
        p_email: normalizedEmail,
        p_role: 'doctor',
        p_full_name: fullName,
        p_phone: phone || null,
      })

      if (functionError) {
        return NextResponse.json(
          { error: functionError.message || 'Failed to create profile' },
          { status: 400 }
        )
      }

      // Update hospital_id separately if function doesn't support it
      await supabase
        .from('users')
        .update({ hospital_id: authUser.id })
        .eq('id', authData.user.id)
    } else if (profileError) {
      return NextResponse.json(
        { error: profileError.message || 'Failed to create profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Doctor account created successfully',
      user: {
        id: authData.user.id,
        email: normalizedEmail,
        role: 'doctor',
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create doctor account' },
      { status: 500 }
    )
  }
}

