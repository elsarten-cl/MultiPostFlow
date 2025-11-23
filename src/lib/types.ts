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
