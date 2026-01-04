import { NextRequest, NextResponse } from 'next/server'
import { generateHealthSummary } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { vitals } = body

    if (!vitals) {
      return NextResponse.json(
        { error: 'Vitals data is required' },
        { status: 400 }
      )
    }

    // Validate vitals data structure
    if (!vitals.timestamps || vitals.timestamps.length === 0) {
      return NextResponse.json(
        { error: 'At least one health record with timestamp is required' },
        { status: 400 }
      )
    }

    // Check if we have at least one type of vital sign
    const hasData = 
      (vitals.bloodPressure && vitals.bloodPressure.length > 0) ||
      (vitals.heartRate && vitals.heartRate.length > 0) ||
      (vitals.sugarLevel && vitals.sugarLevel.length > 0)

    if (!hasData) {
      return NextResponse.json(
        { error: 'At least one vital sign (blood pressure, heart rate, or sugar level) is required' },
        { status: 400 }
      )
    }

    // Generate summary using Gemini
    const summary = await generateHealthSummary(vitals)
    
    return NextResponse.json({ 
      summary,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error generating health summary:', error)
    
    // Provide specific error messages
    let errorMessage = 'Failed to generate health summary'
    let statusCode = 500

    // Check for specific error types with prefixes to avoid false positives
    if (error.message?.includes('API_KEY_MISSING') || error.message?.includes('API key is not configured')) {
      errorMessage = 'AI service is not configured. Please add GEMINI_API_KEY to your .env.local file. See GEMINI_SETUP.md for instructions.'
      statusCode = 503
    } else if (error.message?.includes('API_KEY_PERMISSION') || error.message?.includes('FORBIDDEN')) {
      errorMessage = 'AI service access denied. Please check your API key is valid and has proper permissions.'
      statusCode = 403
    } else if (error.message?.includes('MODEL_UNAVAILABLE') || error.message?.includes('MODEL_NOT_FOUND')) {
      errorMessage = 'AI models are not available with your API key. Please check your Google AI Studio settings or try regenerating your API key.'
      statusCode = 503
    } else if (error.message?.includes('RATE_LIMIT') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      errorMessage = 'AI service is temporarily unavailable. Please try again later.'
      statusCode = 503
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

