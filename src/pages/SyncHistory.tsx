import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SyncHistoryStats } from '@/components/sync-history/SyncHistoryStats';
import { SyncHistoryFilters } from '@/components/sync-history/SyncHistoryFilters';
import { SyncHistoryTable } from '@/components/sync-history/SyncHistoryTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useSyncHistoryList, useSyncHistoryStats } from '@/hooks/useSyncHistory';
import { History, RefreshCw } from 'lucide-react';
import type { SyncHistoryFilters as SyncHistoryFiltersType } from '@/types/sync-history';

const DEFAULT_LIMIT = 50;

export default function SyncHistory() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SyncHistoryFiltersType>({
    limit: DEFAULT_LIMIT,
    offset: 0,
  });

  const {
    data: syncHistoryData,
    isLoading,
    error,
    refetch,
  } = useSyncHistoryList(filters);

  const {
    data: stats,
    isLoading: statsLoading,
  } = useSyncHistoryStats(filters.start_date, filters.end_date);

  const handleFiltersChange = (newFilters: SyncHistoryFiltersType) => {
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

  const pagination = syncHistoryData?.pagination;
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
          <History className="w-8 h-8" />
          Sync History
        </h1>
        <p className="text-muted-foreground">
          View and track all synchronization operations and their results.
        </p>
      </div>

      {/* Stats */}
      <SyncHistoryStats stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <SyncHistoryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                {pagination && (
                  <>
                    Showing {filters.offset! + 1} to{' '}
                    {Math.min(filters.offset! + (filters.limit || DEFAULT_LIMIT), pagination.total)}{' '}
                    of {pagination.total} syncs
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
              title="Failed to load sync history"
              description="There was an error loading the sync history. Please try again."
              error={error}
              retry={{ onClick: () => refetch() }}
            />
          ) : isLoading ? (
            <SyncHistoryTable
              syncHistory={[]}
              isLoading={true}
            />
          ) : !syncHistoryData || !syncHistoryData.data || syncHistoryData.data.length === 0 || (syncHistoryData.pagination && syncHistoryData.pagination.total === 0) ? (
            <EmptyState
              icon={<History className="w-16 h-16 text-muted-foreground" />}
              title="No sync history found"
              description="Sync operations will appear here once you start syncing work items from Ardoq to Azure DevOps."
              action={{
                label: 'Start a Sync',
                onClick: () => navigate('/workflow'),
              }}
            />
          ) : (
            <>
              <SyncHistoryTable
                syncHistory={syncHistoryData.data}
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

