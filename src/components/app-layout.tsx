'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Icons } from './icons';
import { cn } from '@/lib/utils';
import { Bot, Loader2, Users, ShieldAlert, Clock } from 'lucide-react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

const navItems = [
  { href: '/dashboard', icon: Icons.Dashboard, label: 'Panel' },
  { href: '/posts/new', icon: Icons.NewPost, label: 'Nueva Publicación' },
];

const adminNavItems = [
  { href: '/admin/users', icon: Users, label: 'Usuarios' },
];

function PendingApprovalScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
      <Clock className="h-16 w-16 text-primary mb-4" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">Cuenta Pendiente de Aprobación</h1>
      <p className="text-muted-foreground max-w-md">
        Tu cuenta ha sido registrada correctamente. Un administrador la revisará pronto. Recibirás una notificación cuando sea aprobada.
      </p>
    </div>
  );
}

function RejectedScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
       <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">Cuenta Rechazada</h1>
      <p className="text-muted-foreground max-w-md">
        Lo sentimos, tu cuenta no ha sido aprobada. Si crees que esto es un error, por favor contacta al soporte.
      </p>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (userProfile?.status === 'pending') {
    return <PendingApprovalScreen />;
  }

  if (userProfile?.status === 'rejected') {
    return <RejectedScreen />;
  }
  
  if (!user) {
     return null; // or a loading indicator, though the effect should redirect
  }

  const isAdmin = userProfile?.role === 'admin';
  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold">MultiPostFlow</span>
          </Link>
          {allNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground",
                pathname === item.href ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <UserMenu />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}

function UserMenu() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'Usuario'} />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName || 'Usuario'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Cerrar Sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
