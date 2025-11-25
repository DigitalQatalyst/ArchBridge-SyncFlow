import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditLog } from '@/types/sync-history';
import { cn } from '@/lib/utils';

interface AuditLogTableProps {
  auditLogs: AuditLog[];
  isLoading: boolean;
}

const actionTypeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  sync_started: { label: 'Sync Started', variant: 'secondary' },
  sync_completed: { label: 'Sync Completed', variant: 'default' },
  sync_failed: { label: 'Sync Failed', variant: 'destructive' },
  sync_cancelled: { label: 'Sync Cancelled', variant: 'outline' },
  config_created: { label: 'Config Created', variant: 'default' },
  config_updated: { label: 'Config Updated', variant: 'secondary' },
  config_deleted: { label: 'Config Deleted', variant: 'destructive' },
  config_activated: { label: 'Config Activated', variant: 'default' },
  connection_tested: { label: 'Connection Tested', variant: 'secondary' },
};

export function AuditLogTable({ auditLogs, isLoading }: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (auditLogs.length === 0 && !isLoading) {
    return null; // Empty state is handled by parent component
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => {
              const actionConfig = actionTypeConfig[log.action_type] || {
                label: log.action_type,
                variant: 'outline' as const,
              };
              const isExpanded = expandedRows.has(log.id);
              const createdAt = new Date(log.created_at);

              return (
                <>
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleRow(log.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{format(createdAt, 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(createdAt, 'HH:mm:ss')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionConfig.variant}>{actionConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm capitalize">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.entity_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">{log.source_ip || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && log.details && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/50">
                        <div className="p-4">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information for this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Action Type</div>
                  <div className="font-medium">
                    {actionTypeConfig[selectedLog.action_type]?.label || selectedLog.action_type}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Entity Type</div>
                  <div className="font-medium capitalize">{selectedLog.entity_type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Entity ID</div>
                  <div className="font-mono text-sm">{selectedLog.entity_id || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
                  <div className="font-medium">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">IP Address</div>
                  <div className="font-mono text-sm">{selectedLog.source_ip || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">User Agent</div>
                  <div className="text-sm break-all">{selectedLog.user_agent || '-'}</div>
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Details</div>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

