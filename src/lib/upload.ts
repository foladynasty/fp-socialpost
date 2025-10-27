import { supabase } from './supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

export interface UploadError {
  message: string;
  code?: string;
}

export interface UploadResult {
  url?: string;
  error?: UploadError;
}

export const validateFile = (file: File): UploadError | null => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: 'File size must be less than 5MB',
      code: 'FILE_TOO_LARGE',
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      message: 'Only JPG, PNG, and GIF images are allowed',
      code: 'INVALID_FILE_TYPE',
    };
  }

  return null;
};

export const uploadImage = async (file: File, userId: string): Promise<UploadResult> => {
  // Validate file
  const validationError = validateFile(file);
  if (validationError) {
    return { error: validationError };
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return {
        error: {
          message: error.message,
          code: 'UPLOAD_FAILED',
        },
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Upload failed',
        code: 'UPLOAD_ERROR',
      },
    };
  }
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const path = url.pathname.split('/post-images/')[1];

    if (!path) return;

    await supabase.storage.from('post-images').remove([path]);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};
