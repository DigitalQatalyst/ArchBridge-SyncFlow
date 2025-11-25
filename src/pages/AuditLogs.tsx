import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AuditLogStats } from '@/components/audit-logs/AuditLogStats';
import { AuditLogFilters } from '@/components/audit-logs/AuditLogFilters';
import { AuditLogTable } from '@/components/audit-logs/AuditLogTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useAuditLogsList, useAuditLogStats } from '@/hooks/useSyncHistory';
import { FileText, RefreshCw } from 'lucide-react';
import type { AuditLogFilters as AuditLogFiltersType } from '@/types/sync-history';

const DEFAULT_LIMIT = 50;

export default function AuditLogs() {
  const [filters, setFilters] = useState<AuditLogFiltersType>({
    limit: DEFAULT_LIMIT,
    offset: 0,
  });

  const {
    data: auditLogsData,
    isLoading,
    error,
    refetch,
  } = useAuditLogsList(filters);

  const {
    data: stats,
    isLoading: statsLoading,
  } = useAuditLogStats(filters.start_date, filters.end_date);

  const handleFiltersChange = (newFilters: AuditLogFiltersType) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      limit: DEFAULT_LIMIT,
      offset: 0,
    });
  };

  const handlePageChange = (newOffset: number) => {
    setFilters({
      ...filters,
      offset: newOffset,
    });
  };

  const pagination = auditLogsData?.pagination;
  const hasMore = pagination?.has_more || false;
  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || DEFAULT_LIMIT)) + 1;
  const totalPages = pagination
    ? Math.ceil(pagination.total / (filters.limit || DEFAULT_LIMIT))
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Track all system activities and changes for compliance and troubleshooting.
        </p>
      </div>

      {/* Stats */}
      <AuditLogStats stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                {pagination && (
                  <>
                    Showing {filters.offset! + 1} to{' '}
                    {Math.min(filters.offset! + (filters.limit || DEFAULT_LIMIT), pagination.total)}{' '}
                    of {pagination.total} events
                  </>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState
              title="Failed to load audit logs"
              description="There was an error loading the audit logs. Please try again."
              error={error}
              retry={{ onClick: () => refetch() }}
            />
          ) : isLoading ? (
            <AuditLogTable
              auditLogs={[]}
              isLoading={true}
            />
          ) : !auditLogsData || !auditLogsData.data || auditLogsData.data.length === 0 || (auditLogsData.pagination && auditLogsData.pagination.total === 0) ? (
            <EmptyState
              icon={<FileText className="w-16 h-16 text-muted-foreground" />}
              title="No audit logs found"
              description="Audit log entries will appear here as system activities occur, such as sync operations, configuration changes, and connection tests."
            />
          ) : (
            <>
              <AuditLogTable
                auditLogs={auditLogsData.data}
                isLoading={false}
              />

              {/* Pagination */}
              {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (filters.offset! > 0) {
                              handlePageChange(Math.max(0, filters.offset! - (filters.limit || DEFAULT_LIMIT)));
                            }
                          }}
                          className={
                            filters.offset === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (hasMore) {
                              handlePageChange(filters.offset! + (filters.limit || DEFAULT_LIMIT));
                            }
                          }}
                          className={!hasMore ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

