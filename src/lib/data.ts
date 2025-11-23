import type { Post } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Q3 Marketing Campaign Launch',
    content: 'Get ready for our biggest campaign of the year! We are launching...',
    status: 'published',
    platforms: ['facebook', 'instagram'],
    scheduledAt: new Date('2023-10-01T10:00:00Z'),
    createdAt: new Date('2023-09-28T14:30:00Z'),
    imageUrl: PlaceHolderImages[0]?.imageUrl,
    imageHint: PlaceHolderImages[0]?.imageHint,
  },
  {
    id: '2',
    title: 'New Blog Post: The Future of AI',
    content: 'Our latest blog post explores the exciting advancements in AI and what they mean...',
    status: 'scheduled',
    platforms: ['wordpress'],
    scheduledAt: new Date(),
    createdAt: new Date('2023-10-02T11:00:00Z'),
  },
  {
    id: '3',
    title: 'Team Retreat Highlights',
    content: 'What an amazing team retreat! Here are some of the highlights...',
    status: 'draft',
    platforms: ['instagram'],
    scheduledAt: null,
    createdAt: new Date('2023-10-03T09:15:00Z'),
    imageUrl: PlaceHolderImages[1]?.imageUrl,
    imageHint: PlaceHolderImages[1]?.imageHint,
  },
  {
    id: '4',
    title: 'Weekly Roundup',
    content: 'This week was packed with updates. Here is a quick summary...',
    status: 'sent-to-make',
    platforms: ['facebook', 'wordpress'],
    scheduledAt: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date('2023-10-04T16:00:00Z'),
  },
  {
    id: '5',
    title: 'Product Hunt Launch Failure',
    content: 'Our launch on Product Hunt did not go as planned. Here is what we learned...',
    status: 'error',
    platforms: ['wordpress'],
    scheduledAt: new Date('2023-09-20T12:00:00Z'),
    createdAt: new Date('2023-09-19T18:00:00Z'),
  },
  {
    id: '6',
    title: 'Behind the Scenes',
    content: 'A sneak peek into how we create our products. It all starts with an idea...',
    status: 'pending',
    platforms: ['instagram'],
    scheduledAt: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    createdAt: new Date('2023-10-05T13:45:00Z'),
    imageUrl: PlaceHolderImages[2]?.imageUrl,
    imageHint: PlaceHolderImages[2]?.imageHint,
  },
];
