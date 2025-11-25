export type Platform = 'facebook' | 'instagram' | 'wordpress' | 'marketplace';

export const ALL_PLATFORMS: Platform[] = ['facebook', 'instagram', 'wordpress'];

export type PostStatus =
  | 'draft'
  | 'processing'
  | 'sent-to-make'
  | 'published'
  | 'scheduled'
  | 'error';

export interface DraftContent {
  nombreEmprendimiento: string;
  queOfreces: string;
  queProblemaResuelves: string;
  historia: string;
  conexionTerritorio: string;
  queQuieresQueHagaLaGente: string;
  datosContacto: string;
}

export interface Draft {
  id: string;
  userId: string;
  title: string;
  content: DraftContent; // The base draft content as a structured object
  city: string;
  platformContent: Partial<Record<Platform, string>>; // AI-generated content
  status: PostStatus;
  platforms: Platform[];
  mediaUrls: string[];
  scheduledAt: any | null; // Firestore Timestamp for scheduled posts
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
