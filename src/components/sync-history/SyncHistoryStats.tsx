import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import type { SyncHistoryStats as SyncHistoryStatsType } from '@/types/sync-history';

interface SyncHistoryStatsProps {
  stats: SyncHistoryStatsType | undefined;
  isLoading: boolean;
}

export function SyncHistoryStats({ stats, isLoading }: SyncHistoryStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const successRate = stats.total_syncs > 0 
    ? ((stats.completed_syncs / stats.total_syncs) * 100).toFixed(1)
    : '0.0';

  const avgDurationMinutes = stats.average_duration_ms 
    ? (stats.average_duration_ms / 60000).toFixed(1)
    : '0.0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_syncs}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.completed_syncs} of {stats.total_syncs} successful
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgDurationMinutes}m</div>
          <p className="text-xs text-muted-foreground">Per sync</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items Created</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_items_created.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total_items_failed > 0 && `${stats.total_items_failed} failed`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

