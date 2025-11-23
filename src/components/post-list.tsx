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
import type { Post } from '@/lib/types';
import StatusBadge from './status-badge';
import { Icons } from './icons';

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
        <CardDescription>
          A list of your recent social media posts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Platforms</TableHead>
              <TableHead className="hidden md:table-cell">Scheduled At</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="hidden sm:table-cell">
                  {post.imageUrl ? (
                    <Image
                      alt="Post image"
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
                  <div className="flex items-center gap-2">
                    {post.platforms.map((platform) => {
                      const Icon = Icons[platform.charAt(0).toUpperCase() + platform.slice(1) as keyof typeof Icons];
                      return <Icon key={platform} className="h-5 w-5 text-muted-foreground" />;
                    })}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {post.scheduledAt
                    ? post.scheduledAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not scheduled'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <Ellipsis className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
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
