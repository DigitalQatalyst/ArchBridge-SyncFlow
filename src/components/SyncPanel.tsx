import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useSync } from '@/contexts/SyncContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export const SyncPanel = () => {
  const { selectedHierarchyItems, hierarchyData } = useSync();
  const { sourceType, targetType } = useConnection();
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncResults, setSyncResults] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setProgress(0);
    setSyncResults(null);

    const total = selectedHierarchyItems.length;

    // Simulate syncing with progress
    for (let i = 0; i <= total; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress((i / total) * 100);
    }

    // Simulate results (95% success rate)
    const success = Math.floor(total * 0.95);
    const failed = total - success;

    setSyncResults({ success, failed, total });
    setSyncing(false);
    setSyncComplete(true);
  };

  const selectedItems = hierarchyData.filter((item) =>
    selectedHierarchyItems.includes(item.id)
  );

  const itemsByType = selectedItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Sync</h2>
        <p className="text-muted-foreground">
          Review your selection and start the synchronization process.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Summary</CardTitle>
          <CardDescription>
            Synchronizing from {sourceType} to {targetType}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {sourceType}
              </Badge>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <Badge variant="outline" className="bg-accent/10 text-accent">
                {targetType}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {selectedHierarchyItems.length}
              </p>
              <p className="text-sm text-muted-foreground">items selected</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Items to Sync:</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(itemsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <span className="text-sm capitalize text-muted-foreground">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {syncing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Syncing work items...</p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {syncComplete && syncResults && (
            <div className="space-y-3">
              {syncResults.failed === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <div>
                    <p className="font-semibold text-success">Sync Completed Successfully!</p>
                    <p className="text-sm text-success/80">
                      All {syncResults.success} items synced to {targetType}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <AlertCircle className="w-6 h-6 text-warning" />
                    <div>
                      <p className="font-semibold text-warning">Sync Completed with Issues</p>
                      <p className="text-sm text-warning/80">
                        {syncResults.success} succeeded, {syncResults.failed} failed
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-success/10 rounded-lg border border-success/20 text-center">
                      <p className="text-2xl font-bold text-success">{syncResults.success}</p>
                      <p className="text-xs text-success/80">Successful</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
                      <p className="text-2xl font-bold text-destructive">{syncResults.failed}</p>
                      <p className="text-xs text-destructive/80">Failed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!syncComplete && (
            <Button
              onClick={handleSync}
              disabled={syncing || selectedHierarchyItems.length === 0}
              size="lg"
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  Start Sync to {targetType}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
