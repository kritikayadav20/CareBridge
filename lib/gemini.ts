import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI client
const getGenAI = () => {
  // Try server-side first, then client-side fallback
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('Gemini API key not found. Checked:', {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      NEXT_PUBLIC_GEMINI_API_KEY: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      hasAnyKey: !!(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY),
    })
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable in your .env.local file.')
  }
  
  // Log that we found the key (but don't log the actual key for security)
  console.log('Gemini API key found, initializing client...')
  
  return new GoogleGenerativeAI(apiKey)
}

interface VitalsData {
  bloodPressure?: { systolic: number; diastolic: number; date: string }[]
  heartRate?: { value: number; date: string }[]
  sugarLevel?: { value: number; date: string }[]
  timestamps: string[]
}

export async function generateHealthSummary(vitals: {
  bloodPressure?: { systolic: number; diastolic: number }[]
  heartRate?: number[]
  sugarLevel?: number[]
  timestamps: string[]
}) {
  const genAI = getGenAI()
  
  // Prepare data with dates for better context
  const vitalsData: VitalsData = {
    timestamps: vitals.timestamps,
  }

  if (vitals.bloodPressure && vitals.bloodPressure.length > 0) {
    vitalsData.bloodPressure = vitals.bloodPressure.map((bp, idx) => ({
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      date: vitals.timestamps[idx] || 'Unknown date',
    }))
  }

  if (vitals.heartRate && vitals.heartRate.length > 0) {
    vitalsData.heartRate = vitals.heartRate.map((hr, idx) => ({
      value: hr,
      date: vitals.timestamps[idx] || 'Unknown date',
    }))
  }

  if (vitals.sugarLevel && vitals.sugarLevel.length > 0) {
    vitalsData.sugarLevel = vitals.sugarLevel.map((sl, idx) => ({
      value: sl,
      date: vitals.timestamps[idx] || 'Unknown date',
    }))
  }

  // Calculate basic statistics for context
  const stats = {
    bloodPressure: vitalsData.bloodPressure ? {
      avgSystolic: Math.round(
        vitalsData.bloodPressure.reduce((sum, bp) => sum + bp.systolic, 0) / vitalsData.bloodPressure.length
      ),
      avgDiastolic: Math.round(
        vitalsData.bloodPressure.reduce((sum, bp) => sum + bp.diastolic, 0) / vitalsData.bloodPressure.length
      ),
      minSystolic: Math.min(...vitalsData.bloodPressure.map(bp => bp.systolic)),
      maxSystolic: Math.max(...vitalsData.bloodPressure.map(bp => bp.systolic)),
      count: vitalsData.bloodPressure.length,
    } : null,
    heartRate: vitalsData.heartRate ? {
      average: Math.round(
        vitalsData.heartRate.reduce((sum, hr) => sum + hr.value, 0) / vitalsData.heartRate.length
      ),
      min: Math.min(...vitalsData.heartRate.map(hr => hr.value)),
      max: Math.max(...vitalsData.heartRate.map(hr => hr.value)),
      count: vitalsData.heartRate.length,
    } : null,
    sugarLevel: vitalsData.sugarLevel ? {
      average: Number(
        (vitalsData.sugarLevel.reduce((sum, sl) => sum + sl.value, 0) / vitalsData.sugarLevel.length).toFixed(1)
      ),
      min: Math.min(...vitalsData.sugarLevel.map(sl => sl.value)),
      max: Math.max(...vitalsData.sugarLevel.map(sl => sl.value)),
      count: vitalsData.sugarLevel.length,
    } : null,
  }

  // Try using REST API directly with v1 endpoint (not v1beta)
  // This avoids SDK version issues
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file and restart the server.')
    }
    
    const prompt = `You are a healthcare data analysis assistant. Analyze the following patient vital signs data and provide a clear, informative, and non-diagnostic summary.

IMPORTANT RULES:
- Do NOT provide medical diagnoses
- Do NOT recommend specific treatments or medications
- Use simple, easy-to-understand language
- Focus on trends, patterns, and observations
- Be encouraging and supportive in tone
- Mention if values are within normal ranges when appropriate

VITAL SIGNS DATA:
${JSON.stringify(vitalsData, null, 2)}

STATISTICAL SUMMARY:
${JSON.stringify(stats, null, 2)}

Provide a comprehensive but concise analysis (3-4 paragraphs) that includes:
1. Overall health trends: Are the vital signs generally stable, improving, or showing changes over time?
2. Pattern analysis: Are there any noticeable patterns (e.g., consistent values, fluctuations, trends)?
3. Range observations: How do the values compare to typical healthy ranges (mention ranges but don't diagnose)?
4. General insights: What does this data suggest about the patient's health monitoring? (Keep it informational only)

Format your response in clear paragraphs. Use friendly, accessible language that a patient can understand. End with a reminder that this is for informational purposes only and that they should consult healthcare professionals for medical advice.`

    // Try v1 API endpoint directly (more reliable than v1beta)
    const modelsToTry = [
      'gemini-2.5-flash',  // Latest flash model
      'gemini-1.5-flash',  // Fallback
      'gemini-pro',        // Original fallback
    ]
    
    let lastError: any = null
    
    for (const modelName of modelsToTry) {
      try {
        // Use v1 API endpoint directly
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
            }),
          }
        )
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
          
          // Check for specific error types
          if (response.status === 400 && errorMsg.includes('API key')) {
            throw new Error('INVALID_API_KEY: API key is invalid or malformed')
          }
          if (response.status === 403) {
            throw new Error('FORBIDDEN: API key does not have permission to access this model')
          }
          if (response.status === 404) {
            throw new Error(`MODEL_NOT_FOUND: Model ${modelName} not found or not available`)
          }
          
          throw new Error(`API_ERROR_${response.status}: ${errorMsg}`)
        }
        
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (!text) {
          throw new Error('No text in response')
        }
        
        console.log(`Successfully generated summary using model: ${modelName} (v1 API)`)
        return text
      } catch (error: any) {
        console.log(`Model ${modelName} failed:`, error.message)
        lastError = error
        continue
      }
    }
    
    // If all models failed with v1, throw error
    throw lastError || new Error('All models failed')
  } catch (error: any) {
    console.error('Error generating health summary:', error)
    
    // Provide helpful error messages with specific prefixes to avoid confusion
    if (error.message?.includes('INVALID_API_KEY') || error.message?.includes('API key is not configured')) {
      throw new Error('API_KEY_MISSING: Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file and restart the server.')
    }
    if (error.message?.includes('FORBIDDEN') || error.message?.includes('403')) {
      throw new Error('API_KEY_PERMISSION: AI service access denied. Please check your API key is valid and has proper permissions.')
    }
    if (error.message?.includes('MODEL_NOT_FOUND') || error.message?.includes('404')) {
      throw new Error('MODEL_UNAVAILABLE: AI models are not available with your API key. Please check your Google AI Studio settings or try regenerating your API key.')
    }
    if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')) {
      throw new Error('RATE_LIMIT: API rate limit reached. Please try again later.')
    }
    
    // Re-throw with original message if it's already a specific error
    throw error
  }
}
