# CareBridge Setup Guide

## Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Create Supabase project
- [ ] Run database schema: `database/schema.sql`
- [ ] Create storage bucket: `medical-reports` (private)
- [ ] Get Google Cloud Gemini API key
- [ ] Create `.env.local` with credentials
- [ ] Run `npm run dev`

## Detailed Setup

### Step 1: Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for project to be ready

2. **Run Database Schema**
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `database/schema.sql`
   - Paste and run the SQL
   - Verify all tables are created

3. **Create Storage Bucket**
   - Go to Storage in Supabase dashboard
   - Click "Create Bucket"
   - Name: `medical-reports`
   - **Important**: Make it **Private** (not public)
   - Click "Create bucket"

4. **Get Credentials**
   - Go to Settings → API
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Google Cloud Gemini Setup

1. **Get API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the API key → `NEXT_PUBLIC_GEMINI_API_KEY`

2. **Enable API** (if needed)
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable "Generative Language API"

### Step 3: Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 4: Run Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Testing the Application

1. **Create Accounts**
   - Sign up as a Patient
   - Sign up as a Hospital (create 2 hospital accounts)
   - Sign up as a Doctor

2. **Patient Flow**
   - Login as patient
   - Add health records
   - Upload medical reports
   - View health charts and AI summaries

3. **Transfer Flow**
   - Login as Hospital 1
   - Request transfer for a patient
   - Login as Hospital 2
   - Accept the transfer
   - View patient data
   - Use chat for coordination

4. **Doctor Flow**
   - Login as doctor
   - View active transfers
   - Access patient data for accepted transfers

## Common Issues

**"Failed to fetch" errors**
- Check environment variables
- Verify Supabase project is active
- Check browser console for specific errors

**Storage upload fails**
- Verify bucket name is exactly `medical-reports`
- Check bucket is private
- Verify RLS policies are applied

**Gemini API errors**
- Verify API key is correct
- Check API quota/limits
- Ensure API is enabled

**RLS policy errors**
- Re-run schema.sql
- Check user roles are set correctly
- Verify foreign key relationships

