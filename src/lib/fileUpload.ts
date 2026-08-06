import { supabase } from '@/integrations/supabase/client';
import { logWithCorrelation, captureException } from './errorTracking';
import { compressToWebP } from './imageCompressor';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_FILE_COUNT = 2;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Proposal attachment types
const PROPOSAL_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const PROPOSAL_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    // Validate incoming file type BEFORE compression (compressor may change type to webp).
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Dateityp ${file.type} nicht erlaubt. Nur Bilder erlaubt`);
    }

    // Compress to WebP (GIFs pass through unchanged).
    const processed = await compressToWebP(file, 0.8, 1920);

    // Validate size on the processed file.
    if (processed.size > MAX_FILE_SIZE) {
      throw new Error(`Datei zu groß. Maximum: 3MB (aktuell: ${(processed.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = processed.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}_${sanitizedName}`;

    logWithCorrelation('Uploading file', { path: filePath, originalSize: file.size, processedSize: processed.size, type: processed.type });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('lead-media')
      .upload(filePath, processed, {
        cacheControl: '3600',
        upsert: false,
        contentType: processed.type,
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
    captureException(error as Error, {
      context: 'uploadLeadMedia',
      userId,
      originalSize: file?.size ?? null,
      mimeType: file?.type ?? null,
    });
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

/**
 * Upload a proposal attachment (PDF, JPG, PNG)
 * Files are stored in lead-media bucket under proposals/{userId}/
 */
export async function uploadProposalAttachment(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file type on the original (PDFs must be recognised as PDF).
    if (!PROPOSAL_ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Nur PDF, JPG oder PNG erlaubt');
    }

    // Compress images to WebP; PDFs pass through unchanged.
    const processed = await compressToWebP(file, 0.8, 1920);

    // Validate size on the processed file.
    if (processed.size > PROPOSAL_MAX_FILE_SIZE) {
      throw new Error(`Datei zu groß. Maximum: 5MB (aktuell: ${(processed.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = processed.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `proposals/${userId}/${timestamp}_${sanitizedName}`;

    logWithCorrelation('Uploading proposal attachment', { path: filePath, originalSize: file.size, processedSize: processed.size, type: processed.type });

    // Upload to Supabase Storage (reuse lead-media bucket)
    const { data, error } = await supabase.storage
      .from('lead-media')
      .upload(filePath, processed, {
        cacheControl: '3600',
        upsert: false,
        contentType: processed.type,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('lead-media')
      .getPublicUrl(filePath);

    logWithCorrelation('Proposal attachment uploaded successfully', { url: publicUrl });

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    logWithCorrelation('Proposal attachment upload failed', { error });
    captureException(error as Error, {
      context: 'uploadProposalAttachment',
      userId,
      originalSize: file?.size ?? null,
      mimeType: file?.type ?? null,
    });
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
    };
  }
}

// ---------------------------------------------------------------------------
// Handwerker profile images (logo + portfolio)
// ---------------------------------------------------------------------------

const HANDWERKER_BUCKET = 'handwerker-portfolio';
const HANDWERKER_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];
const HANDWERKER_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB after compression

/**
 * Upload a handwerker logo or portfolio image.
 * SSOT: same validate → compress → upload → publicUrl flow as lead media.
 * Images are compressed to WebP first, so large phone photos never hit the
 * network at full size (memory + mobile-connection safety).
 */
export async function uploadHandwerkerImage(
  file: File,
  userId: string,
  kind: 'logo' | 'portfolio',
): Promise<UploadResult> {
  try {
    if (!HANDWERKER_ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Dateityp ${file.type || 'unbekannt'} nicht erlaubt. Bitte JPG, PNG oder WebP verwenden.`,
      );
    }

    // Compress to WebP (GIF and undecodable files pass through unchanged).
    const processed = await compressToWebP(file, 0.82, kind === 'logo' ? 800 : 1600);

    if (processed.size > HANDWERKER_MAX_FILE_SIZE) {
      throw new Error(
        `Datei zu gross. Maximum: 5MB (aktuell: ${(processed.size / 1024 / 1024).toFixed(2)}MB)`,
      );
    }

    const extension = processed.type === 'image/webp'
      ? 'webp'
      : (processed.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');

    const filePath = kind === 'logo'
      ? `${userId}/logo.${extension}`
      : `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    logWithCorrelation('Uploading handwerker image', {
      path: filePath,
      kind,
      originalSize: file.size,
      processedSize: processed.size,
      type: processed.type,
    });

    const { error } = await supabase.storage
      .from(HANDWERKER_BUCKET)
      .upload(filePath, processed, {
        cacheControl: '3600',
        upsert: kind === 'logo',
        contentType: processed.type,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(HANDWERKER_BUCKET)
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath };
  } catch (error) {
    logWithCorrelation('Handwerker image upload failed', { error, kind });
    captureException(error as Error, {
      context: 'uploadHandwerkerImage',
      userId,
      kind,
      bucket: HANDWERKER_BUCKET,
      originalSize: file?.size ?? null,
      mimeType: file?.type ?? null,
    });
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload fehlgeschlagen',
    };
  }
}

/**
 * Remove a handwerker image by its public URL.
 */
export async function deleteHandwerkerImage(publicUrl: string): Promise<boolean> {
  const parts = publicUrl.split(`/${HANDWERKER_BUCKET}/`);
  if (parts.length !== 2) return false;

  const path = parts[1].split('?')[0];
  const { error } = await supabase.storage.from(HANDWERKER_BUCKET).remove([path]);

  if (error) {
    logWithCorrelation('Handwerker image deletion failed', { error, path });
    return false;
  }
  return true;
}
