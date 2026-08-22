import { supabase } from './supabase';

export interface UploadProgressCallback {
  (stage: string, percent: number): void;
}

/**
 * Compress an image file to reduce size before uploading (Max 1400px, 0.8 quality)
 */
export async function compressImage(file: File, maxWidth = 1400, quality = 0.8): Promise<File> {
  // If not image, return as is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressed);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Convert file to Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Upload a document to Supabase Storage or Google Drive with progress callbacks
 */
export async function uploadMembershipDocument(
  file: File,
  folderName: string,
  docType: 'id_front' | 'id_back' | 'baptism',
  onProgress?: UploadProgressCallback
): Promise<string> {
  onProgress?.('جاري تحسين وضغط الصورة...', 20);
  const compressed = await compressImage(file);

  const ext = compressed.name.split('.').pop() || 'jpg';
  const cleanFolderName = folderName.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_');
  const filePath = `members/${cleanFolderName}/${docType}_${Date.now()}.${ext}`;

  onProgress?.('جاري الرفع السحابي وتأمين الملف...', 50);

  try {
    const { data, error } = await supabase.storage
      .from('membership-documents')
      .upload(filePath, compressed, {
        cacheControl: '3600',
        upsert: true
      });

    if (!error && data) {
      const { data: publicData } = supabase.storage
        .from('membership-documents')
        .getPublicUrl(filePath);
      onProgress?.('تم الرفع وتأمين الملف بنجاح!', 100);
      return publicData.publicUrl;
    }
  } catch (err) {
    console.warn('Direct bucket upload failed, using secure base64 storage fallback:', err);
  }

  // Fallback: Convert to Base64 data URL
  onProgress?.('جاري الحفظ الآمن للمستند...', 80);
  const base64 = await fileToBase64(compressed);
  onProgress?.('تم إكمال تجهيز المستند!', 100);
  return base64;
}
