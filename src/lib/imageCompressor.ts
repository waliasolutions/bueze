import { logWithCorrelation } from './errorTracking';

/**
 * Client-side image compression to WebP using Canvas.
 * SSOT for all pre-upload image processing.
 *
 * - Skips non-images, GIFs (animation) and PDFs → returns original.
 * - Fails safe: any error returns the original file so uploads never break.
 * - Preserves aspect ratio, caps width at maxWidth (default 1920).
 */
export async function compressToWebP(
  file: File,
  quality = 0.8,
  maxWidth = 1920,
): Promise<File> {
  // Only process still images; leave GIFs (animation) and everything else alone.
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const done = (result: File) => {
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          logWithCorrelation('compressToWebP: canvas ctx unavailable, fallback to original', { name: file.name });
          done(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              logWithCorrelation('compressToWebP: toBlob null, fallback to original', { name: file.name });
              done(file);
              return;
            }

            // If compression somehow inflated the file, keep the original.
            if (blob.size >= file.size) {
              done(file);
              return;
            }

            const base = file.name.replace(/\.[^./\\]+$/, '') || file.name;
            const compressed = new File([blob], `${base}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            done(compressed);
          },
          'image/webp',
          quality,
        );
      } catch (err) {
        logWithCorrelation('compressToWebP: exception, fallback to original', { error: err, name: file.name });
        done(file);
      }
    };

    img.onerror = () => {
      logWithCorrelation('compressToWebP: image decode failed, fallback to original', { name: file.name, type: file.type });
      done(file);
    };

    img.src = objectUrl;
  });
}
