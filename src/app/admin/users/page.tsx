'use client';

import { useMemoFirebase } from '@/firebase/provider';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AppLayout from '@/components/app-layout';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UsersAdminPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users');
  }, [firestore, user]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  if (user && user.email !== 'agencia@elsartenpro.com' && !isUserLoading) {
    router.push('/');
    return null;
  }
  
  const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { role });
  };

  const handleTypeChange = async (userId: string, type: 'revista' | 'marketplace' | 'ambos') => {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { type });
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administración de Usuarios</h1>
            <p className="text-muted-foreground">
              Gestiona los roles y tipos de los usuarios.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Lista de todos los usuarios registrados en la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {!isLoading && users && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(value: 'admin' | 'user') => handleRoleChange(u.id, value)}
                          disabled={u.email === 'agencia@elsartenpro.com'}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">Usuario</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                       <TableCell>
                        <Select
                          value={u.type}
                          onValueChange={(value: 'revista' | 'marketplace' | 'ambos') => handleTypeChange(u.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revista">Revista</SelectItem>
                            <SelectItem value="marketplace">Marketplace</SelectItem>
                             <SelectItem value="ambos">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt.seconds * 1000).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
