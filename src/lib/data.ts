import type { Post } from './types';
import { PlaceHolderImages } from './placeholder-images';

// This data is now for demonstration purposes and can be removed later.
export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Lanzamiento Campaña Marketing Q3',
    content: '¡Prepárate para nuestra campaña más grande del año! Estamos lanzando...',
    status: 'published',
    platforms: ['facebook', 'instagram'],
    scheduledAt: new Date('2023-10-01T10:00:00Z'),
    createdAt: new Date('2023-09-28T14:30:00Z'),
    imageUrl: PlaceHolderImages[0]?.imageUrl,
    imageHint: PlaceHolderImages[0]?.imageHint,
  },
  {
    id: '2',
    title: 'Nuevo Post: El Futuro de la IA',
    content: 'Nuestro último post explora los emocionantes avances en IA y lo que significan...',
    status: 'scheduled',
    platforms: ['wordpress'],
    scheduledAt: new Date(),
    createdAt: new Date('2023-10-02T11:00:00Z'),
  },
  {
    id: '3',
    title: 'Destacados del Retiro de Equipo',
    content: '¡Qué increíble retiro de equipo! Aquí están algunos de los mejores momentos...',
    status: 'draft',
    platforms: ['instagram'],
    scheduledAt: null,
    createdAt: new Date('2023-10-03T09:15:00Z'),
    imageUrl: PlaceHolderImages[1]?.imageUrl,
    imageHint: PlaceHolderImages[1]?.imageHint,
  },
  {
    id: '4',
    title: 'Resumen Semanal',
    content: 'Esta semana estuvo llena de actualizaciones. Aquí hay un resumen rápido...',
    status: 'sent-to-make',
    platforms: ['facebook', 'wordpress'],
    scheduledAt: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 días desde ahora
    createdAt: new Date('2023-10-04T16:00:00Z'),
  },
  {
    id: '5',
    title: 'Fallo en Lanzamiento de Product Hunt',
    content: 'Nuestro lanzamiento en Product Hunt no salió como lo planeamos. Esto es lo que aprendimos...',
    status: 'error',
    platforms: ['wordpress'],
    scheduledAt: new Date('2023-09-20T12:00:00Z'),
    createdAt: new Date('2023-09-19T18:00:00Z'),
  },
  {
    id: '6',
    title: 'Detrás de Escena',
    content: 'Un vistazo a cómo creamos nuestros productos. Todo comienza con una idea...',
    status: 'pending',
    platforms: ['instagram'],
    scheduledAt: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 días desde ahora
    createdAt: new Date('2023-10-05T13:45:00Z'),
    imageUrl: PlaceHolderImages[2]?.imageUrl,
    imageHint: PlaceHolderImages[2]?.imageHint,
  },
];
