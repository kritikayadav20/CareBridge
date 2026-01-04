import { createClient } from './supabase/client'

const BUCKET_NAME = 'medical-reports'

/**
 * Upload a medical report to Supabase Storage (private bucket)
 * Returns the file path (not a public URL) for secure storage
 */
export async function uploadMedicalReport(
  file: File,
  patientId: string,
  reportName: string
): Promise<string> {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const sanitizedName = reportName.replace(/[^a-zA-Z0-9-_]/g, '_')
  const fileName = `${patientId}/${timestamp}_${sanitizedName}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Return the file path (not a public URL) for secure storage in database
  return data.path
}

/**
 * Delete a medical report from Supabase Storage
 * @param filePath - The file path stored in the database
 */
export async function deleteMedicalReport(filePath: string) {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Get a signed URL for viewing/downloading a medical report
 * Signed URLs expire after the specified duration (default: 1 hour)
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const supabase = createClient()
  
  // Clean the file path - remove any leading slashes or bucket name
  let cleanPath = filePath.trim()
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1)
  }
  // Remove bucket name if it's included in the path
  if (cleanPath.startsWith(`${BUCKET_NAME}/`)) {
    cleanPath = cleanPath.substring(BUCKET_NAME.length + 1)
  }
  
  console.log('Creating signed URL for path:', cleanPath, 'in bucket:', BUCKET_NAME)
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(cleanPath, expiresIn)

  if (error) {
    console.error('Storage error details:', {
      error,
      filePath,
      cleanPath,
      bucket: BUCKET_NAME
    })
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

