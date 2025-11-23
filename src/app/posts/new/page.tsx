import AppLayout from '@/components/app-layout';
import { PostForm } from '@/components/post-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewPostPage() {
  return (
    <AppLayout>
      <div className="mx-auto grid max-w-4xl gap-6">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
          <p className="text-muted-foreground">
            Draft your content and let AI tailor it for each platform.
          </p>
        </div>
        <PostForm />
      </div>
    </AppLayout>
  );
}
