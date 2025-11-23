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
          <h1 className="text-3xl font-bold tracking-tight">Crear Nueva Publicación</h1>
          <p className="text-muted-foreground">
            Escribe tu contenido y deja que la IA lo adapte para cada plataforma.
          </p>
        </div>
        <PostForm />
      </div>
    </AppLayout>
  );
}
