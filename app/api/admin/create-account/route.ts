import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
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

    if (!userProfile || (userProfile as UserProfile).role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, fullName, phone, role } = body

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase()
    
    // Basic email format check (very lenient - let Supabase do the real validation)
    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address (must include @ and domain)' },
        { status: 400 }
      )
    }

    // Admin can only create hospital accounts
    // Doctors are created by hospitals
    if (role !== 'hospital') {
      return NextResponse.json(
        { error: 'Admin can only create hospital accounts. Doctors are created by hospitals.' },
        { status: 400 }
      )
    }

    // Check if email already exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: `An account with email ${normalizedEmail} already exists in the system` },
        { status: 400 }
      )
    }

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    })

    if (authError) {
      // Show the actual Supabase error message for debugging
      let errorMessage = authError.message
      
      // Provide more helpful error messages for common cases
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        errorMessage = `An account with email ${normalizedEmail} already exists. Please use a different email.`
      } else if (authError.message.includes('User already registered')) {
        errorMessage = `Email ${normalizedEmail} is already registered. Please use a different email.`
      } else if (authError.message.includes('password')) {
        errorMessage = `Password validation failed: ${authError.message}`
      } else if (authError.message.includes('Email rate limit')) {
        errorMessage = `Too many requests. Please wait a moment and try again.`
      }
      
      // Log the full error for debugging
      console.error('Supabase auth error:', {
        message: authError.message,
        status: authError.status,
        email: normalizedEmail
      })
      
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

    // Create user profile using database function (bypasses RLS)
    const { error: profileError } = await (supabase
      .from('users') as any)
      .insert({
        id: authData.user.id,
        email: normalizedEmail,
        role: role as 'hospital',
        full_name: fullName,
        phone: phone || null,
      })

    // If direct insert fails due to RLS, try using the database function
    if (profileError && profileError.message.includes('row-level security')) {
      const { error: functionError } = await (supabase.rpc as any)('create_user_profile', {
        p_user_id: authData.user.id,
        p_email: normalizedEmail,
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

    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: normalizedEmail,
        role: role,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}

