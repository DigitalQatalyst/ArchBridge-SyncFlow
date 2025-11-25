import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity, TrendingUp, Clock } from 'lucide-react';
import type { AuditLogStats as AuditLogStatsType, ActionType } from '@/types/sync-history';

interface AuditLogStatsProps {
  stats: AuditLogStatsType | undefined;
  isLoading: boolean;
}

const actionTypeLabels: Record<ActionType, string> = {
  sync_started: 'Sync Started',
  sync_completed: 'Sync Completed',
  sync_failed: 'Sync Failed',
  sync_cancelled: 'Sync Cancelled',
  config_created: 'Config Created',
  config_updated: 'Config Updated',
  config_deleted: 'Config Deleted',
  config_activated: 'Config Activated',
  connection_tested: 'Connection Tested',
};

export function AuditLogStats({ stats, isLoading }: AuditLogStatsProps) {
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

  // Get top 3 action types
  const topActions = Object.entries(stats.action_type_counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_events.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Events Today</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.events_today}</div>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Active</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {topActions.length > 0 ? (
            <>
              <div className="text-lg font-bold">
                {actionTypeLabels[topActions[0][0] as ActionType]}
              </div>
              <p className="text-xs text-muted-foreground">
                {topActions[0][1]} events
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Action Types</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Object.keys(stats.action_type_counts).length}
          </div>
          <p className="text-xs text-muted-foreground">Unique types</p>
        </CardContent>
      </Card>
    </div>
  );
}

