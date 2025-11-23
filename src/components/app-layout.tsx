'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Bot } from 'lucide-react';

const navItems = [
  { href: '/', icon: Icons.Dashboard, label: 'Panel' },
  { href: '/posts/new', icon: Icons.NewPost, label: 'Nueva Publicación' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://picsum.photos/seed/user/40/40" alt="Usuario" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Usuario</p>
            <p className="text-xs leading-none text-muted-foreground">
              usuario@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
