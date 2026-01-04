# 🚀 Quick Start Guide - CareBridge

## Fast Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create `.env.local` in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### 3. Set Up Supabase
1. Run `database/supabase-setup.sql` in Supabase SQL Editor
2. Create storage bucket `medical-reports` (PRIVATE)

### 4. Run the App
```bash
npm run dev
```

### 5. Open Browser
Go to: http://localhost:3000

## Quick Test

1. **Sign Up** → Create account as "Patient"
2. **Login** → Use your credentials
3. **Dashboard** → Should see your dashboard
4. **Profile** → Click Profile in nav, update your name
5. **Add Health Record** → Add a test record
6. **View Records** → See charts and AI summary

## If Something Doesn't Work

1. Check `.env.local` exists and has correct values
2. Check Supabase database schema is run
3. Check browser console (F12) for errors
4. Restart dev server: `Ctrl+C` then `npm run dev`

See `HOW_TO_RUN.md` for detailed instructions!


