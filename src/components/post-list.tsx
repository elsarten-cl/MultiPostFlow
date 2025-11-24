import Image from 'next/image';
import { Ellipsis } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Post, Platform } from '@/lib/types';
import StatusBadge from './status-badge';
import { Icons } from './icons';

function PlatformIcons({ platforms }: { platforms: Platform[] }) {
    const platformIcons = platforms.map(platform => {
      if (platform === 'marketplace') {
        // Special case for marketplace
        return <span key={platform} className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Marketplace</span>;
      }
      if(platform === 'wordpress') {
        return <Icons.Wordpress key={platform} className="h-5 w-5 text-muted-foreground" />
      }
      const Icon = Icons[platform.charAt(0).toUpperCase() + platform.slice(1) as keyof typeof Icons];
      return Icon ? <Icon key={platform} className="h-5 w-5 text-muted-foreground" /> : null;
    });

    return <div className="flex items-center gap-2">{platformIcons}</div>;
}


export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publicaciones Recientes</CardTitle>
        <CardDescription>
          Una lista de tus publicaciones recientes en redes sociales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Imagen</span>
              </TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Plataformas</TableHead>
              <TableHead className="hidden md:table-cell">Programado Para</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="hidden sm:table-cell">
                  {post.imageUrl ? (
                    <Image
                      alt="Imagen de la publicación"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={post.imageUrl}
                      width="64"
                      data-ai-hint={post.imageHint}
                    />
                  ) : (
                    <div className="aspect-square h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                      <Icons.NewPost className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <StatusBadge status={post.status} />
                </TableCell>
                <TableCell>
                  <PlatformIcons platforms={post.platforms} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {post.scheduledAt
                    ? new Date(post.scheduledAt).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No programado'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <Ellipsis className="h-4 w-4" />
                        <span className="sr-only">Alternar menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Duplicar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
