# Medical Reports Storage Setup

This guide explains how to set up the Supabase Storage bucket for medical reports.

## Storage Bucket Configuration

### 1. Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **New bucket**
4. Configure as follows:
   - **Name**: `medical-reports`
   - **Public bucket**: ❌ **NO** (Keep it private for security)
   - **File size limit**: Set appropriate limit (e.g., 10MB)
   - **Allowed MIME types**: Leave empty or specify (e.g., `application/pdf,image/*`)

### 2. Create Storage RLS Policies (Required for Uploads)

**IMPORTANT**: Supabase Storage has RLS enabled by default, which blocks file uploads.

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open and run the file: `database/disable-storage-rls.sql`
   - This creates permissive RLS policies **ONLY** for the `medical-reports` bucket
   - Allows authenticated users to upload, read, and delete files
   - Database tables are **NOT** affected
4. Verify the script executed successfully (should show 3 policies created)

**Note**: This is a demo-only configuration. Access is still controlled via:
- Application-level access control (API routes)
- Signed URLs for temporary access
- Private bucket (files not publicly accessible)

### 3. Storage Policies

The bucket should be **private** and access should be controlled through:

1. **Application-level access control** (implemented in API routes)
2. **Signed URLs** for temporary access (1 hour expiry)

### 4. File Structure

Files are stored with the following structure:
```
medical-reports/
  └── {patient_id}/
      └── {timestamp}_{sanitized_report_name}.{ext}
```

Example:
```
medical-reports/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1704067200000_Blood_Test_Report.pdf
```

### 5. Security Features

✅ **Private bucket** - Files are not publicly accessible
✅ **Signed URLs** - Temporary access links (1 hour expiry)
✅ **Access control** - API route validates user permissions
✅ **File path storage** - Database stores paths, not public URLs

### 6. Access Control Rules

Users can access reports if:
- **Patient**: Own reports
- **Hospital**: Reports for patients admitted to their hospital
- **Doctor**: Reports for patients at their hospital
- **Transfer context**: Reports for patients in accepted/completed transfers

### 7. API Endpoint

**GET** `/api/reports/[id]/signed-url`
- Generates a signed URL valid for 1 hour
- Validates user permissions before generating URL
- Returns `{ signedUrl: string }`

## Testing

1. Upload a report as a patient
2. Verify the file is stored in the private bucket
3. Test viewing the report (should generate signed URL)
4. Verify access is denied for unauthorized users
5. Test that signed URLs expire after 1 hour

