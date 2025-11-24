export type Platform = 'facebook' | 'instagram' | 'wordpress';

export const ALL_PLATFORMS: Platform[] = ['facebook', 'instagram', 'wordpress'];

export type PostStatus =
  | 'pending' // Pending approval or scheduling
  | 'processing'
  | 'sent-to-make'
  | 'published'
  | 'scheduled'
  | 'error';

export interface Draft {
  id: string;
  userId: string;
  title: string;
  content: string; // The base draft content
  platformContent: Partial<Record<Platform, string>>; // AI-generated content
  status: PostStatus;
  platforms: Platform[];
  mediaUrls: string[];
  scheduledAt: Date | null; // Firestore Timestamp for scheduled posts
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}


export interface Post {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  platforms: Platform[];
  scheduledAt: Date | null;
  createdAt: Date;
  imageUrl?: string;
  imageHint?: string;
}

export type UserRole = 'admin' | 'user';
export type UserType = 'revista' | 'marketplace' | 'ambos';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  type: UserType;
  status: UserStatus;
  createdAt: any; // Can be Date or FieldValue
}
