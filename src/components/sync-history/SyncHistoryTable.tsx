import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { SyncHistory } from '@/types/sync-history';
import { cn } from '@/lib/utils';

interface SyncHistoryTableProps {
  syncHistory: SyncHistory[];
  isLoading: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  pending: { label: 'Pending', variant: 'outline' },
};

function formatDuration(durationMs?: number): string {
  if (!durationMs) return '-';
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function SyncHistoryTable({ syncHistory, isLoading }: SyncHistoryTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (syncHistory.length === 0 && !isLoading) {
    return null; // Empty state is handled by parent component
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date/Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source → Target</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {syncHistory.map((sync) => {
            const status = statusConfig[sync.status] || statusConfig.pending;
            const createdAt = new Date(sync.created_at);
            const successRate = sync.total_items > 0
              ? ((sync.items_created / sync.total_items) * 100).toFixed(0)
              : '0';

            return (
              <TableRow key={sync.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{format(createdAt, 'MMM dd, yyyy')}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(createdAt, 'HH:mm:ss')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm capitalize">{sync.source_type}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm capitalize">{sync.target_type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{sync.project_name}</span>
                    {sync.overwrite_mode && (
                      <Badge variant="outline" className="w-fit mt-1 text-xs">
                        Overwrite
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {sync.items_created}/{sync.total_items} created
                    </span>
                    {sync.items_failed > 0 && (
                      <span className="text-xs text-destructive">
                        {sync.items_failed} failed
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {successRate}% success
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {sync.duration_ms ? formatDuration(sync.duration_ms) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/sync-history/${sync.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

