import { supabase } from '@/integrations/supabase/client';
import { logWithCorrelation, captureException } from './errorTracking';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_FILE_COUNT = 2;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 * Files are organized by user ID: {userId}/{timestamp}_{filename}
 */
export async function uploadLeadMedia(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Datei zu groß. Maximum: 3MB (aktuell: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Dateityp ${file.type} nicht erlaubt. Nur Bilder erlaubt`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}_${sanitizedName}`;

    logWithCorrelation('Uploading file', { path: filePath, size: file.size });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('lead-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('lead-media')
      .getPublicUrl(filePath);

    logWithCorrelation('File uploaded successfully', { url: publicUrl });

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    logWithCorrelation('File upload failed', { error });
    captureException(error as Error, { context: 'uploadLeadMedia', userId });
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteLeadMedia(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('lead-media')
      .remove([path]);

    if (error) throw error;

    logWithCorrelation('File deleted successfully', { path });
    return true;
  } catch (error) {
    logWithCorrelation('File deletion failed', { error, path });
    captureException(error as Error, { context: 'deleteLeadMedia', path });
    return false;
  }
}

/**
 * Batch upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  // Validate file count
  if (files.length > MAX_FILE_COUNT) {
    throw new Error(`Maximum ${MAX_FILE_COUNT} Bilder erlaubt`);
  }

  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadLeadMedia(files[i], userId);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }
  
  return results;
}
