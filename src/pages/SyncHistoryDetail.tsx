import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Package,
  Layers,
  FileText,
} from 'lucide-react';
import { useSyncHistory, useSyncHistoryItems } from '@/hooks/useSyncHistory';
import { ErrorState } from '@/components/ErrorState';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SyncHistoryItem } from '@/types/sync-history';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  completed: { label: 'Completed', variant: 'default', icon: <CheckCircle className="h-4 w-4" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  in_progress: { label: 'In Progress', variant: 'secondary', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: <XCircle className="h-4 w-4" /> },
  pending: { label: 'Pending', variant: 'outline', icon: <Clock className="h-4 w-4" /> },
};

const itemTypeIcons: Record<string, React.ReactNode> = {
  epic: <Layers className="h-4 w-4" />,
  feature: <Package className="h-4 w-4" />,
  user_story: <FileText className="h-4 w-4" />,
};

function formatDuration(durationMs?: number): string {
  if (!durationMs) return '-';
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default function SyncHistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: syncHistory,
    isLoading,
    error,
  } = useSyncHistory(id);

  const {
    data: itemsData,
    isLoading: itemsLoading,
  } = useSyncHistoryItems(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !syncHistory) {
    return (
      <ErrorState
        title="Failed to load sync history"
        description="The sync history record could not be found or loaded."
        error={error}
        retry={{ onClick: () => window.location.reload() }}
      />
    );
  }

  const status = statusConfig[syncHistory.status] || statusConfig.pending;
  const startedAt = syncHistory.started_at ? new Date(syncHistory.started_at) : null;
  const completedAt = syncHistory.completed_at ? new Date(syncHistory.completed_at) : null;
  const items = itemsData?.data || [];

  // Group items by type
  const itemsByType = items.reduce((acc, item) => {
    if (!acc[item.item_type]) {
      acc[item.item_type] = { created: 0, failed: 0, items: [] };
    }
    if (item.status === 'created') {
      acc[item.item_type].created++;
    } else if (item.status === 'failed') {
      acc[item.item_type].failed++;
    }
    acc[item.item_type].items.push(item);
    return acc;
  }, {} as Record<string, { created: number; failed: number; items: SyncHistoryItem[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sync-history')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sync Details</h1>
            <p className="text-muted-foreground">
              {syncHistory.project_name} • {startedAt && format(startedAt, 'MMM dd, yyyy HH:mm:ss')}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} className="flex items-center gap-2">
          {status.icon}
          {status.label}
        </Badge>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Overview of the synchronization operation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Source → Target</div>
              <div className="text-lg font-semibold capitalize">
                {syncHistory.source_type} → {syncHistory.target_type}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Project</div>
              <div className="text-lg font-semibold">{syncHistory.project_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Duration</div>
              <div className="text-lg font-semibold">
                {syncHistory.duration_ms ? formatDuration(syncHistory.duration_ms) : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
              <div className="text-lg font-semibold">
                {syncHistory.total_items > 0
                  ? ((syncHistory.items_created / syncHistory.total_items) * 100).toFixed(1)
                  : '0'}
                %
              </div>
            </div>
          </div>

          {syncHistory.overwrite_mode && syncHistory.deletion_count > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Overwrite Mode:</strong> {syncHistory.deletion_count} existing work items were deleted before syncing.
              </AlertDescription>
            </Alert>
          )}

          {syncHistory.error_message && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {syncHistory.error_message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Breakdown by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown by Type</CardTitle>
          <CardDescription>Items created and failed by work item type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">Epics</span>
              </div>
              <div className="text-2xl font-bold">
                {syncHistory.epics_created}/{syncHistory.epics_created + syncHistory.epics_failed}
              </div>
              {syncHistory.epics_failed > 0 && (
                <div className="text-sm text-destructive mt-1">
                  {syncHistory.epics_failed} failed
                </div>
              )}
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold">Features</span>
              </div>
              <div className="text-2xl font-bold">
                {syncHistory.features_created}/{syncHistory.features_created + syncHistory.features_failed}
              </div>
              {syncHistory.features_failed > 0 && (
                <div className="text-sm text-destructive mt-1">
                  {syncHistory.features_failed} failed
                </div>
              )}
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold">User Stories</span>
              </div>
              <div className="text-2xl font-bold">
                {syncHistory.user_stories_created}/{syncHistory.user_stories_created + syncHistory.user_stories_failed}
              </div>
              {syncHistory.user_stories_failed > 0 && (
                <div className="text-sm text-destructive mt-1">
                  {syncHistory.user_stories_failed} failed
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            Detailed list of all items processed during this sync
          </CardDescription>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No items found for this sync
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(itemsByType).map(([type, typeData]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                    {itemTypeIcons[type]}
                    {type.replace('_', ' ')} ({typeData.items.length})
                  </h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Azure DevOps ID</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typeData.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={item.status === 'created' ? 'default' : 'destructive'}
                              >
                                {item.status === 'created' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.azure_devops_id ? (
                                <span className="font-mono">{item.azure_devops_id}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.azure_devops_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={item.azure_devops_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View
                                  </a>
                                </Button>
                              )}
                              {item.error_message && (
                                <div className="text-xs text-destructive mt-1">
                                  {item.error_message}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Timing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Started At</div>
              <div className="font-medium">
                {startedAt ? format(startedAt, 'PPpp') : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Completed At</div>
              <div className="font-medium">
                {completedAt ? format(completedAt, 'PPpp') : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

