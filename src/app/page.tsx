import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/app-layout';
import PostList from '@/components/post-list';
import { mockPosts } from '@/lib/data';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your social media posts here.
            </p>
          </div>
          <Button asChild>
            <Link href="/posts/new">
              <PlusCircle />
              New Post
            </Link>
          </Button>
        </div>
        <PostList posts={mockPosts} />
      </div>
    </AppLayout>
  );
}
