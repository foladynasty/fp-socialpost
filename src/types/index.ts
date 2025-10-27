// User and Profile types
export type UserRole = 'creator' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Post types
export type PostStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'publishing' | 'published' | 'failed';

export type Platform = 'linkedin' | 'facebook' | 'instagram';

export interface PublishedUrls {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

export interface Post {
  id: string;
  creator_id: string;
  content: string;
  image_url: string | null;
  scheduled_date: string;
  status: PostStatus;
  rejection_reason: string | null;
  platforms: Platform[];
  published_at: string | null;
  published_urls: PublishedUrls | null;
  publish_error: string | null;
  created_at: string;
  updated_at: string;
  // Joined data (when fetching with profile info)
  profiles?: Profile;
}

// Form data types
export interface PostFormData {
  content: string;
  image_url?: string | null;
  scheduled_date: Date;
  status?: PostStatus;
  platforms?: Platform[];
}

export interface ProfileUpdateData {
  full_name: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  full_name?: string;
}

// API Response types
export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
