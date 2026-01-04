# How to Run CareBridge - Step by Step Guide

## Prerequisites Checklist

Before running the application, make sure you have:

- [ ] Node.js 18+ installed (check with `node --version`)
- [ ] npm installed (check with `npm --version`)
- [ ] Supabase project created
- [ ] Database schema run in Supabase
- [ ] Storage bucket created in Supabase
- [ ] Google Cloud Gemini API key

## Step 1: Install Dependencies

Open terminal in the project directory and run:

```bash
npm install
```

This will install all required packages (Next.js, Supabase, Recharts, etc.)

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory (same level as `package.json`):

```bash
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# Or create it manually in your editor
```

Add these variables to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google Cloud Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

### How to Get Supabase Credentials:

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **API**
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### How to Get Gemini API Key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **Create API Key**
4. Copy the key → `NEXT_PUBLIC_GEMINI_API_KEY`

## Step 3: Set Up Supabase Database

1. **Run the SQL Schema**:
   - Go to Supabase Dashboard → **SQL Editor**
   - Click **New Query**
   - Open `database/supabase-setup.sql`
   - Copy entire contents and paste
   - Click **Run** (or press Ctrl+Enter)
   - Verify no errors

2. **Create Storage Bucket**:
   - Go to **Storage** in Supabase dashboard
   - Click **Create Bucket**
   - Name: `medical-reports`
   - **IMPORTANT**: Set to **PRIVATE** (not public)
   - Click **Create bucket**

3. **Enable Realtime (Optional - for chat)**:
   - Go to **SQL Editor** again
   - Run this command:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
   ```

## Step 4: Run the Development Server

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

## Step 5: Open the Application

Open your browser and go to:
```
http://localhost:3000
```

## Step 6: Test the Application

### Test 1: Landing Page
- ✅ Should see "CareBridge" heading
- ✅ Should see "Sign In" and "Get Started" buttons
- ✅ Should see feature cards

### Test 2: User Registration
1. Click **Get Started** or go to `/signup`
2. Fill in the form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: test1234 (min 6 characters)
   - Phone: +1234567890 (optional)
   - Role: Select "Patient"
3. Click **Create account**
4. ✅ Should redirect to dashboard
5. ✅ Should see your name and role in top right

### Test 3: Login
1. Click **Logout** (if logged in)
2. Go to `/login`
3. Enter email and password
4. Click **Sign in**
5. ✅ Should redirect to dashboard

### Test 4: Profile Management
1. Click **Profile** in the top navigation
2. ✅ Should see your profile information
3. Update your name
4. Click **Update Profile**
5. ✅ Should see success message
6. Test password change:
   - Click **Change Password**
   - Enter current password
   - Enter new password (min 6 chars)
   - Confirm new password
   - Click **Change Password**
   - ✅ Should see success message

### Test 5: Health Records (Patient Role)
1. Go to **Dashboard** → **Add Health Record**
2. Fill in:
   - Date & Time: Today's date
   - Blood Pressure: 120/80
   - Heart Rate: 72
   - Sugar Level: 100
3. Click **Add Record**
4. ✅ Should redirect to health records page
5. ✅ Should see your record in the table
6. ✅ Should see charts (if multiple records)
7. ✅ Should see AI health summary (if Gemini API is working)

### Test 6: Medical Reports (Patient Role)
1. Go to **Dashboard** → **Medical Reports**
2. Click **Upload Report**
3. Fill in:
   - Report Name: Test Report
   - Report Type: Lab Report (optional)
   - File: Select any file (PDF, image, etc.)
4. Click **Upload**
5. ✅ Should see success and report in list
6. ✅ Should be able to view/download report

### Test 7: Patient Transfer (Hospital Role)
1. **Create a Hospital Account**:
   - Logout
   - Sign up as "Hospital"
   - Email: hospital@example.com

2. **Create a Patient Account** (if not exists):
   - Sign up as "Patient"
   - Email: patient@example.com

3. **Request Transfer**:
   - Login as Hospital
   - Go to **Dashboard** → **Request Transfer**
   - Select patient
   - Select receiving hospital (create another hospital account)
   - Select transfer type
   - Click **Request Transfer**
   - ✅ Should see transfer in list

4. **Accept Transfer**:
   - Login as receiving hospital
   - Go to **Transfers**
   - Click on transfer
   - Click **Accept Transfer**
   - ✅ Status should change to "accepted"
   - ✅ Should see patient health data

### Test 8: Real-time Chat
1. Go to a transfer detail page (as hospital or patient)
2. Scroll to chat section
3. Type a message
4. Click **Send**
5. ✅ Should see message appear immediately
6. Open in another browser/incognito as another user
7. ✅ Should see messages in real-time

## Common Issues & Solutions

### Issue 1: "Failed to fetch" or Connection Errors

**Solution**:
- Check `.env.local` file exists and has correct values
- Verify Supabase project is active
- Check Supabase URL and key are correct
- Restart dev server: `Ctrl+C` then `npm run dev`

### Issue 2: "Not authenticated" Errors

**Solution**:
- Make sure you're logged in
- Check browser console for errors
- Verify Supabase authentication is enabled
- Try logging out and back in

### Issue 3: Database Errors (Table doesn't exist)

**Solution**:
- Go to Supabase SQL Editor
- Run `database/supabase-setup.sql` again
- Check for any error messages
- Verify tables exist: Go to **Table Editor** in Supabase

### Issue 4: Storage Upload Fails

**Solution**:
- Verify `medical-reports` bucket exists
- Check bucket is set to **PRIVATE**
- Verify storage policies were created (run SQL again)
- Check file size isn't too large

### Issue 5: Gemini API Errors

**Solution**:
- Verify API key is correct in `.env.local`
- Check API key hasn't expired
- Verify Gemini API is enabled in Google Cloud
- Check API quota/limits

### Issue 6: Port 3000 Already in Use

**Solution**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

### Issue 7: TypeScript Errors

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
# Windows: rmdir /s .next

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

## Quick Verification Checklist

After setup, verify:

- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can create account
- [ ] Can login
- [ ] Can view dashboard
- [ ] Can access profile page
- [ ] Can add health record (if patient)
- [ ] Can upload report (if patient)
- [ ] Can create transfer (if hospital)
- [ ] Database tables exist in Supabase
- [ ] Storage bucket exists
- [ ] No console errors in browser

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for errors (red text)
- **Network tab**: Check API calls are successful (200 status)
- **Application tab**: Check cookies/localStorage for session

## Next Steps After Testing

Once everything works:
1. ✅ Create test accounts for all roles
2. ✅ Test complete user flows
3. ✅ Verify all features work
4. ✅ Prepare demo data
5. ✅ Ready for hackathon presentation!

## Need Help?

If something doesn't work:
1. Check browser console for errors
2. Check terminal for server errors
3. Verify all environment variables are set
4. Verify Supabase setup is complete
5. Check the troubleshooting section above

Happy coding! 🚀


