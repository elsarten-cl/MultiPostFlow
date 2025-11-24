export type Platform = 'facebook' | 'instagram' | 'wordpress';

export const ALL_PLATFORMS: Platform[] = ['facebook', 'instagram', 'wordpress'];

export type PostStatus =
  | 'draft'
  | 'pending'
  | 'processing'
  | 'sent-to-make'
  | 'published'
  | 'error';

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
