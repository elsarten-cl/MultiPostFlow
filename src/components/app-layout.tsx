'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
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
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from './ui/sidebar';
import { Icons } from './icons';
import { cn } from '@/lib/utils';
import { Bot, Loader2, Users, ShieldAlert, Clock } from 'lucide-react';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

const navItems = [
  { href: '/', icon: Icons.Dashboard, label: 'Panel' },
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="bg-primary/10 text-primary hover:bg-primary/20">
              <Bot className="h-5 w-5" />
            </Button>
            <span className="font-bold text-lg">MultiPostFlow</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn(
                    'justify-start',
                    pathname === item.href &&
                      'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
             {isAdmin && (
              <>
                <SidebarMenuItem>
                  <div className="my-2 border-t border-sidebar-border" />
                </SidebarMenuItem>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      className={cn(
                        'justify-start',
                        pathname.startsWith(item.href) &&
                          'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-end border-b bg-background/80 px-4 backdrop-blur-sm sm:px-8">
          <UserMenu />
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
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

function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  const memoized = React.useMemo(factory, deps);
  if (typeof memoized === 'object' && memoized !== null) {
    (memoized as any).__memo = true;
  }
  return memoized;
}
