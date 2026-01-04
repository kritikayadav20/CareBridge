# CareBridge - Patient Transfer Platform

A healthcare web application for seamless, secure sharing of patient medical data between hospitals during emergency and non-emergency transfers.

Built for **Google TechSprint 2026** using Google Cloud Gemini API for AI-powered health summaries.

## 🚀 Features

- **Authentication**: Secure email/password authentication via Supabase
- **Role-Based Access**: Patient, Doctor, and Hospital roles with appropriate permissions
- **Patient Health Data Management**: Store and manage health records (BP, heart rate, sugar levels)
- **Health Data Visualization**: Interactive charts showing vital trends over time
- **AI Health Summaries**: Google Cloud Gemini-powered explanations of health trends
- **Patient Transfer System**: Request, accept, and track patient transfers between hospitals
- **Medical Reports**: Upload and manage medical reports with secure storage
- **Real-time Chat**: Coordinate transfers with real-time messaging using Supabase Realtime

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **AI**: Google Cloud Gemini API
- **Charts**: Recharts
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Cloud account with Gemini API access

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `database/schema.sql`
3. Create a storage bucket named `medical-reports`:
   - Go to Storage → Create Bucket
   - Name: `medical-reports`
   - Make it **private** (not public)
   - Enable RLS policies

4. Get your Supabase credentials:
   - Project URL (Settings → API → Project URL)
   - Anon Key (Settings → API → anon/public key)

### 3. Set Up Google Cloud Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini
3. Enable the Gemini API in your Google Cloud project

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Cloud Gemini API (server-side only)
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard and feature pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── HealthChart.tsx    # Health data visualization
│   ├── HealthSummary.tsx  # AI health summary
│   ├── TransferChat.tsx   # Real-time chat
│   └── AcceptTransferButton.tsx
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase client setup
│   ├── auth.ts           # Authentication helpers
│   ├── storage.ts        # File upload utilities
│   └── gemini.ts         # Gemini API integration
├── types/                 # TypeScript types
│   ├── database.ts       # Database types
│   └── index.ts         # Shared types
├── database/              # Database schema
│   └── schema.sql        # Complete database schema with RLS
└── middleware.ts         # Next.js middleware for auth
```

## 🔐 Security Features

- **Row Level Security (RLS)**: All database tables have RLS policies enforcing:
  - Patients can only access their own data
  - Hospitals can access patient data only for assigned transfers
  - Doctors can access patient data only during active transfers
- **Secure File Storage**: Medical reports stored in private Supabase Storage bucket
- **Role-Based Access Control**: Middleware and server-side checks for role permissions

## 🎯 User Roles

### Patient
- View and manage their own health records
- Upload medical reports
- View transfer history
- Access AI health summaries

### Hospital
- Request patient transfers
- Accept incoming transfer requests
- View patient data for accepted transfers
- Coordinate via real-time chat

### Doctor
- View patient data during active transfers
- Access health records and reports for accepted transfers
- Participate in transfer coordination chat

## 🔄 Transfer Workflow

1. **Request**: Hospital creates a transfer request (emergency/non-emergency)
2. **Accept**: Receiving hospital accepts the transfer
3. **Access**: Patient data becomes accessible to receiving hospital
4. **Coordinate**: Real-time chat for coordination
5. **Complete**: Transfer marked as completed

## 📊 Health Data Features

- **Time-Series Storage**: Health records stored with timestamps for trend analysis
- **Interactive Charts**: Visual representation of vital signs over time
- **AI Summaries**: Gemini API generates non-diagnostic explanations of health trends

## 🚨 Important Notes

- This is a hackathon project built for demonstration purposes
- AI summaries are informational only and should not be used for diagnosis
- All medical data handling follows privacy best practices with RLS
- Ensure proper HIPAA compliance for production use

## 📝 Database Schema

The database includes:
- `users`: User profiles with roles
- `patients`: Patient-specific information
- `health_records`: Time-series health data
- `transfers`: Transfer requests and status
- `medical_reports`: Report metadata and file URLs
- `messages`: Real-time chat messages

See `database/schema.sql` for complete schema with RLS policies.

## 🐛 Troubleshooting

### Supabase Connection Issues
- Verify your environment variables are set correctly
- Check that your Supabase project is active
- Ensure RLS policies are applied

### Gemini API Errors
- Verify your API key is correct
- Check API quota limits
- Ensure Gemini API is enabled in Google Cloud

### Storage Upload Issues
- Verify the `medical-reports` bucket exists
- Check bucket permissions and RLS policies
- Ensure file size limits are appropriate

## 📄 License

Built for Google TechSprint 2026

## 🤝 Contributing

This is a hackathon project. For production use, consider:
- Enhanced error handling
- Comprehensive testing
- Additional security audits
- HIPAA compliance review
- Performance optimization
