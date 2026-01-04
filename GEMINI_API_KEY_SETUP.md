# Gemini API Key Setup - Step by Step Guide

## Quick Setup (Recommended for Hackathon/Demo)

### Option 1: Use Default Gemini Project (Easiest)

**Best for**: Quick setup, development, testing, hackathons

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. **Name your key**: 
   - Enter any name you like, e.g., "CareBridge Health App"
   - This is just for your reference
5. **Choose a project**: Select **"Default Gemini Project"**
   - ✅ This is the **easiest option**
   - ✅ No Google Cloud project setup needed
   - ✅ Free tier available
   - ✅ Perfect for development and demos
6. Click **"Create API Key"**
7. **IMPORTANT**: Copy the API key immediately and save it somewhere safe
   - You won't be able to see the full key again after this
   - It will look something like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

### Option 2: Create a New Project (For Production)

**Best for**: Production apps, when you need more control

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. **Name your key**: Enter a descriptive name
5. **Choose a project**: Select **"Create project"**
   - Enter a project name (e.g., "CareBridge")
   - This creates a new Google Cloud project
   - More control over billing and settings
6. Click **"Create API Key"**
7. Copy the API key

### Option 3: Import Existing Project (If You Have One)

**Best for**: If you already have a Google Cloud project

1. Select **"Import project"**
2. Choose your existing Google Cloud project
3. Follow the same steps to create the API key

## Recommendation

**For Google TechSprint 2026 / Hackathon**: Use **"Default Gemini Project"** (Option 1)

- ✅ Fastest setup (takes 30 seconds)
- ✅ No Google Cloud project management needed
- ✅ Free tier is generous enough for demos
- ✅ Perfect for development and testing

## After Getting Your API Key

1. Create or edit `.env.local` in your project root:
   ```env
   GEMINI_API_KEY=your_copied_api_key_here
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

3. Test it at `/dashboard/health-records`

## Free Tier Limits

The free tier includes:
- **60 requests per minute**
- **1,500 requests per day**
- More than enough for development and demos!

## Security Note

- Never commit your `.env.local` file to git
- The API key should stay server-side only
- Don't share your API key publicly

## Troubleshooting

**"API key is invalid"**
- Make sure you copied the entire key
- Check for extra spaces before/after the key
- Verify the key in `.env.local` file

**"Quota exceeded"**
- You've hit the free tier limit
- Wait a few minutes and try again
- Or upgrade to a paid plan if needed

## Need Help?

- Check `QUICK_GEMINI_FIX.md` for troubleshooting
- See `GEMINI_SETUP.md` for detailed documentation

