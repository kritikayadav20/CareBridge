# Google Cloud Gemini API Setup Guide

## Overview
CareBridge uses Google Cloud Gemini API to generate AI-powered health summaries from patient vital signs data. This provides non-diagnostic insights and trend analysis.

## Features Implemented

### ✅ Integration with Google Cloud Gemini API
- Server-side API integration using `@google/generative-ai` package
- Secure API key handling (server-side only)
- Error handling and retry logic

### ✅ AI-Generated Health Trend Analysis
- Comprehensive analysis of vital signs trends
- Pattern recognition and statistical analysis
- Time-series data interpretation

### ✅ Non-Diagnostic Explanations
- Simple, easy-to-understand language
- Patient-friendly explanations
- No medical diagnoses or treatment recommendations
- Clear disclaimers about informational use only

### ✅ Automatic Summary Generation
- Automatically generates summaries when health records are viewed
- Analyzes all available vital signs (BP, Heart Rate, Sugar Level)
- Provides insights based on data patterns

### ✅ Server-Side API Route
- Secure API route: `/api/health-summary`
- API key stored server-side only (never exposed to client)
- Authentication required
- Input validation and error handling

### ✅ Summary Display with Disclaimers
- Professional UI with clear disclaimers
- Loading states and error handling
- Auto-retry for transient errors
- Timestamp and attribution

## Setup Instructions

### Step 1: Get Google Cloud Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### Step 2: Add API Key to Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Google Cloud Gemini API Key
GEMINI_API_KEY=your_api_key_here
```

**Important:** 
- Never commit `.env.local` to version control
- The API key should be server-side only (use `GEMINI_API_KEY`, not `NEXT_PUBLIC_GEMINI_API_KEY`)
- The code will fall back to `NEXT_PUBLIC_GEMINI_API_KEY` if needed, but server-side is preferred

### Step 3: Restart Development Server

After adding the API key, restart your Next.js development server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### Step 4: Test the Integration

1. Log in as a patient
2. Add at least one health record with vital signs
3. Go to `/dashboard/health-records`
4. The AI Health Summary section should generate a summary automatically

## How It Works

### 1. Data Collection
- When health records are displayed, the `HealthSummary` component collects all vital signs data
- Data includes: Blood Pressure (Systolic/Diastolic), Heart Rate, Sugar Level, and timestamps

### 2. API Request
- Client component calls `/api/health-summary` with vitals data
- Server-side route validates authentication and data
- Calls Gemini API with a carefully crafted prompt

### 3. AI Analysis
- Gemini analyzes the data and generates a comprehensive summary
- Includes trend analysis, pattern recognition, and observations
- Uses simple, non-medical language

### 4. Display
- Summary is displayed in a professional card with disclaimers
- Includes loading states and error handling
- Shows timestamp and attribution

## API Route Details

**Endpoint:** `POST /api/health-summary`

**Request Body:**
```json
{
  "vitals": {
    "bloodPressure": [
      { "systolic": 120, "diastolic": 80 }
    ],
    "heartRate": [72],
    "sugarLevel": [100],
    "timestamps": ["2024-01-01T10:00:00Z"]
  }
}
```

**Response:**
```json
{
  "summary": "AI-generated summary text...",
  "generatedAt": "2024-01-01T10:00:00Z"
}
```

## Security Features

1. **Server-Side Only**: API key never exposed to client
2. **Authentication Required**: Only authenticated users can generate summaries
3. **Input Validation**: Validates vitals data before processing
4. **Error Handling**: Graceful error messages without exposing sensitive info

## Model Configuration

- **Model**: `gemini-1.5-flash` (fast, cost-effective)
- **Fallback**: `gemini-pro` (if flash is unavailable)
- **Temperature**: Default (balanced creativity/accuracy)

## Prompt Engineering

The prompt is carefully designed to:
- Request non-diagnostic analysis only
- Use simple, accessible language
- Focus on trends and patterns
- Include statistical context
- Emphasize informational use only

## Error Handling

The system handles:
- Missing API key
- API rate limits
- Network errors
- Invalid data
- Authentication failures

## Usage Locations

AI Health Summaries are displayed in:
1. **Patient Health Records Page** (`/dashboard/health-records`)
   - Shows summary for all patient's health records
   
2. **Transfer Detail View** (`/dashboard/transfers/[id]`)
   - Shows summary for patient's health records during transfer
   - Only visible to authorized parties (hospitals, doctors)

## Cost Considerations

- Gemini API has a free tier with generous limits
- Each summary generation counts as one API call
- Summaries are generated on-demand (not cached)
- Consider implementing caching for production use

## Troubleshooting

### "AI service is not configured"
- Check that `GEMINI_API_KEY` is set in `.env.local`
- Restart the development server after adding the key

### "API rate limit reached"
- You've exceeded the free tier limits
- Wait a few minutes and try again
- Consider upgrading your Google Cloud plan

### "Failed to generate summary"
- Check your internet connection
- Verify the API key is valid
- Check server logs for detailed error messages

## Future Enhancements

Potential improvements:
- Caching summaries to reduce API calls
- Batch processing for multiple patients
- Customizable summary length
- Export summaries as PDF
- Historical summary comparison

## Files

- `lib/gemini.ts` - Gemini API client and prompt engineering
- `app/api/health-summary/route.ts` - Server-side API route
- `components/HealthSummary.tsx` - Client component for displaying summaries

## Summary

All features from `feature.txt` lines 45-51 are fully implemented:
✅ Integration with Google Cloud Gemini API
✅ AI-generated health trend analysis
✅ Non-diagnostic explanations in simple language
✅ Automatic summary generation from vital signs
✅ Server-side API route for secure API key handling
✅ Summary display with appropriate disclaimers

The AI health summary feature is production-ready and provides valuable, non-diagnostic insights to help patients understand their health data trends.

