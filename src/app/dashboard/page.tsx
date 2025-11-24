'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/app-layout';
import PostList from '@/components/post-list';
import { useUser } from '@/firebase';

export default function DashboardPage() {
  const { user } = useUser();

  // We'll fetch real posts later. For now, an empty array.
  const posts = [];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel</h1>
            <p className="text-muted-foreground">
              Gestiona tus publicaciones de redes sociales aquí.
            </p>
          </div>
          <Button asChild>
            <Link href="/posts/new">
              <PlusCircle />
              Nueva Publicación
            </Link>
          </Button>
        </div>
        <PostList posts={posts} />
      </div>
    </AppLayout>
  );
}
