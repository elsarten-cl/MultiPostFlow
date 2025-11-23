import { cn } from '@/lib/utils';
import type { PostStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

type StatusBadgeProps = {
  status: PostStatus;
  className?: string;
};

const statusLabels: Record<PostStatus, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  processing: 'Procesando',
  'sent-to-make': 'Enviado a producción',
  published: 'Publicado',
  error: 'Error',
};

const statusStyles: Record<PostStatus, string> = {
  draft: 'bg-gray-200 text-gray-800 hover:bg-gray-200',
  pending: 'bg-status-pending/20 text-status-pending hover:bg-status-pending/20',
  processing: 'bg-status-processing text-blue-800 hover:bg-status-processing',
  'sent-to-make': 'bg-status-sent-to-make/20 text-status-sent-to-make hover:bg-status-sent-to-make/20',
  published: 'bg-status-published/20 text-status-published hover:bg-status-published/20',
  error: 'bg-status-error/20 text-status-error hover:bg-status-error/20',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        'capitalize border-none',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </Badge>
  );
}
