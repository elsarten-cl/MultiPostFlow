'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Bot, Loader2 } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

function getFirebaseAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'El formato del email no es válido.';
    case 'auth/user-disabled':
      return 'Este usuario ha sido deshabilitado.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Este email ya está en uso. Intenta iniciar sesión.';
    default:
      return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
  }
}

async function createUserDocument(
  firestore: any,
  user: User,
  data: { name?: string }
) {
  const userRef = doc(firestore, 'users', user.uid);
  const isAdmin = user.email === 'agencia@elsartenpro.com';

  const userData = {
    id: user.uid,
    email: user.email,
    name: data.name || user.displayName || user.email?.split('@')[0] || 'Usuario',
    role: isAdmin ? 'admin' : 'user',
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, userData, { merge: true });
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleAuthAction = async (
    action: 'login' | 'signup',
    data: LoginFormValues
  ) => {
    setIsLoading(true);
    try {
      let userCredential;
      if (action === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await createUserDocument(firestore, userCredential.user, {});
      }
      
      toast({
        title:
          action === 'login'
            ? '¡Has iniciado sesión!'
            : '¡Cuenta creada con éxito!',
        description: 'Redirigiendo al panel...',
      });
      router.push('/');
    } catch (error) {
      console.error(`${action} error:`, error);
      const errorMessage = getFirebaseAuthErrorMessage(error as AuthError);
      toast({
        title: `Error de ${action === 'login' ? 'inicio de sesión' : 'registro'}`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bienvenido a MultiPostFlow</CardTitle>
          <CardDescription>
            Inicia sesión o crea una cuenta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="tu@email.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                <Button
                  type="button"
                  className="w-full"
                  onClick={form.handleSubmit((data) =>
                    handleAuthAction('login', data)
                  )}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Sesión
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={form.handleSubmit((data) =>
                    handleAuthAction('signup', data)
                  )}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrarse
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
