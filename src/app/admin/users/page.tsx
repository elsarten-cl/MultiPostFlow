'use client';

import { useMemoFirebase } from '@/firebase/provider';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { UserProfile, UserStatus } from '@/lib/types';
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
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<UserStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-500',
  approved: 'bg-green-500 hover:bg-green-500',
  rejected: 'bg-red-500 hover:bg-red-500',
};

export default function UsersAdminPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!user || user.email !== 'agencia@elsartenpro.com') return null;
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

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    const userRef = doc(firestore, 'users', userId);
    try {
      await updateDoc(userRef, { status });
      toast({
        title: 'Estado Actualizado',
        description: `El estado del usuario ha sido cambiado a ${status}.`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administración de Usuarios</h1>
            <p className="text-muted-foreground">
              Gestiona los roles, tipos y estado de los usuarios.
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
                    <TableHead>Estado</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{u.name?.charAt(0) ?? 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-white', statusColors[u.status])}>
                          {u.status}
                        </Badge>
                      </TableCell>
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
                        {u.status === 'pending' && (
                           <div className="flex gap-2">
                            <Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50" onClick={() => handleStatusChange(u.id, 'approved')}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                             <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50" onClick={() => handleStatusChange(u.id, 'rejected')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                           </div>
                        )}
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
