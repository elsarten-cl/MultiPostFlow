'use client';

import Link from 'next/link';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/app-layout';
import PostList from '@/components/post-list';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Draft } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const draftsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'drafts'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: posts, isLoading } = useCollection<Draft>(draftsQuery);

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
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && <PostList posts={posts || []} />}
      </div>
    </AppLayout>
  );
}
