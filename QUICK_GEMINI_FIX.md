# Quick Fix: AI Service Not Configured

## Problem
You're seeing the error: "AI service is not configured. Please contact support."

This means the Gemini API key is not set up in your environment variables.

## Solution

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. **Name your key**: Enter a name like "CareBridge Health App" (or any name you prefer)
5. **Choose a project**: Select **"Default Gemini Project"** (this is the easiest option for quick setup)
   - This option is perfect for development and testing
   - No need to create or import a Google Cloud project
   - Free tier is available
6. Click "Create API Key"
7. **Copy the API key immediately** (you won't be able to see it again)

### Step 2: Add to Environment Variables

Create or edit `.env.local` file in your project root:

```env
# Add this line (replace with your actual API key)
GEMINI_API_KEY=your_actual_api_key_here
```

**Important:**
- The file should be named `.env.local` (with the dot at the beginning)
- Don't include quotes around the API key
- Don't commit this file to git (it should be in `.gitignore`)

### Step 3: Restart Your Development Server

1. Stop your server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 4: Test

1. Go to `/dashboard/health-records`
2. The AI Health Summary should now work

## Troubleshooting

### Still not working?

1. **Check the file name**: Must be `.env.local` (not `.env` or `.env.local.txt`)
2. **Check the location**: Must be in the project root (same folder as `package.json`)
3. **Restart the server**: Environment variables are only loaded when the server starts
4. **Check for typos**: Make sure `GEMINI_API_KEY` is spelled correctly
5. **Check the API key**: Make sure you copied the entire key without extra spaces

### Verify Your Setup

Check your `.env.local` file should look like this:

```env
# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Gemini API (add this)
GEMINI_API_KEY=your_gemini_api_key
```

## Need Help?

- See `GEMINI_SETUP.md` for detailed setup instructions
- Check the console logs for more specific error messages
- Make sure your API key is valid and not expired

