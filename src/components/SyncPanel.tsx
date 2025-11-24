import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, ArrowRight, ExternalLink, X } from 'lucide-react';
import { useSync, HierarchyItem } from '@/contexts/SyncContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSyncAzureDevOpsWorkItems, ItemProgress } from '@/hooks/useAzureDevOps';
import { transformHierarchyToSyncFormat } from '@/lib/sync-helpers';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ProgressNodeProps {
  item: HierarchyItem;
  progress: ItemProgress | undefined;
  level: number;
  children: HierarchyItem[];
  allItems: HierarchyItem[];
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  getItemProgress: (itemId: string) => ItemProgress | undefined;
}

const ProgressNode = ({
  item,
  progress,
  level,
  children,
  allItems,
  expandedNodes,
  onToggleExpand,
  getItemProgress,
}: ProgressNodeProps) => {
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(item.id);
  const status = progress?.status || 'pending';

  const statusConfig = {
    pending: {
      icon: null,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      label: 'Pending',
    },
    creating: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      label: 'Creating...',
    },
    created: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      label: 'Created',
    },
    failed: {
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      label: 'Failed',
    },
  };

  const config = statusConfig[status];
  const typeLabels = {
    epic: 'Epic',
    feature: 'Feature',
    userStory: 'User Story',
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-lg transition-colors',
          config.bgColor,
          status === 'pending' && 'border border-border'
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <div className="flex items-center gap-2 flex-1">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(item.id)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className={cn('flex-shrink-0', config.color)}>
            {config.icon}
          </div>

          <Badge variant="outline" className="text-xs">
            {typeLabels[item.type as keyof typeof typeLabels] || item.type}
          </Badge>

          <span className="font-medium text-foreground flex-1">{item.name}</span>

          {status === 'created' && progress?.azureDevOpsUrl && (
            <a
              href={progress.azureDevOpsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {status === 'failed' && progress?.error && (
            <span className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
              {progress.error}
            </span>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
            <ProgressNode
              key={child.id}
              item={child}
              progress={getItemProgress(child.id)}
              level={level + 1}
              children={allItems.filter((i) => i.parentId === child.id)}
              allItems={allItems}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              getItemProgress={getItemProgress}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SyncPanel = () => {
  const { selectedHierarchyItems, hierarchyData } = useSync();
  const { sourceType, targetType, projectName, targetConfigId } = useConnection();
  const { toast } = useToast();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const {
    isSyncing,
    itemProgress,
    summary,
    error: syncError,
    sync,
    cancel,
    reset,
  } = useSyncAzureDevOpsWorkItems();

  // Auto-expand all epics when sync starts
  useEffect(() => {
    if (isSyncing) {
      const epics = hierarchyData.filter(
        (item) => item.type === 'epic' && selectedHierarchyItems.includes(item.id)
      );
      setExpandedNodes(new Set(epics.map((e) => e.id)));
    }
  }, [isSyncing, hierarchyData, selectedHierarchyItems]);

  const handleSync = async () => {
    if (!projectName) {
      toast({
        title: 'Project Name Required',
        description: 'Please create a project first before syncing.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedHierarchyItems.length === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one item to sync.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const syncRequest = transformHierarchyToSyncFormat(hierarchyData, selectedHierarchyItems);
      await sync(projectName, syncRequest, targetConfigId);
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to start sync',
        variant: 'destructive',
      });
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter to only selected items
  const selectedItems = hierarchyData.filter((item) =>
    selectedHierarchyItems.includes(item.id)
  );

  // Get epics (top-level items for display)
  const epics = selectedItems.filter((item) => item.type === 'epic');

  // Calculate progress
  const totalItems = selectedHierarchyItems.length;
  const createdCount = Array.from(itemProgress.values()).filter(
    (p) => p.status === 'created'
  ).length;
  const failedCount = Array.from(itemProgress.values()).filter(
    (p) => p.status === 'failed'
  ).length;
  const progressPercentage =
    totalItems > 0 ? ((createdCount + failedCount) / totalItems) * 100 : 0;

  // Get progress for an item, with logic to determine "creating" status
  const getItemProgress = (itemId: string): ItemProgress | undefined => {
    const progress = itemProgress.get(itemId);
    if (progress) return progress;

    // If item doesn't have progress yet, check if it should be "creating"
    // An item is "creating" if its parent has been created but it hasn't been processed yet
    if (isSyncing) {
      const item = hierarchyData.find((i) => i.id === itemId);
      if (item && item.parentId) {
        const parentProgress = itemProgress.get(item.parentId);
        if (parentProgress && parentProgress.status === 'created') {
          // Parent is created, so this item might be creating
          // Check if any sibling has been created (indicating we're processing this level)
          const siblings = hierarchyData.filter(
            (i) => i.parentId === item.parentId && i.type === item.type
          );
          const hasCreatedSibling = siblings.some((sibling) => {
            const siblingProgress = itemProgress.get(sibling.id);
            return siblingProgress && siblingProgress.status === 'created';
          });
          if (hasCreatedSibling) {
            return {
              ardoqId: itemId,
              name: item.name,
              status: 'creating',
            };
          }
        }
      }
    }

    return undefined;
  };

  const itemsByType = selectedItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const syncComplete = summary !== null && !isSyncing;
  const hasError = syncError !== null;

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
            {projectName && ` (Project: ${projectName})`}
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
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              <p className="text-sm text-muted-foreground">items selected</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Items to Sync:</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(itemsByType).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 bg-card border rounded-lg"
                >
                  <span className="text-sm capitalize text-muted-foreground">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {isSyncing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Syncing work items...</p>
                </div>
                <Button variant="outline" size="sm" onClick={cancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {createdCount + failedCount} of {totalItems} items processed ({Math.round(progressPercentage)}%)
              </p>
            </div>
          )}

          {isSyncing && epics.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Progress:</h4>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                {epics.map((epic) => (
                  <ProgressNode
                    key={epic.id}
                    item={epic}
                    progress={getItemProgress(epic.id)}
                    level={0}
                    children={selectedItems.filter((i) => i.parentId === epic.id)}
                    allItems={selectedItems}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                    getItemProgress={getItemProgress}
                  />
                ))}
              </div>
            </div>
          )}

          {hasError && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Sync Error</p>
                <p className="text-sm text-destructive/80">{syncError}</p>
              </div>
            </div>
          )}

          {syncComplete && summary && (
            <div className="space-y-3">
              {summary.failed === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      Sync Completed Successfully!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      All {summary.created} items synced to {targetType}
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
                        {summary.created} succeeded, {summary.failed} failed
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {summary.created}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">Successful</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 text-center">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {summary.failed}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border text-center">
                      <p className="text-2xl font-bold text-foreground">{summary.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                  {summary.epics && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 bg-card border rounded text-center">
                        <p className="text-lg font-bold text-foreground">{summary.epics.created}</p>
                        <p className="text-xs text-muted-foreground">Epics</p>
                      </div>
                      <div className="p-2 bg-card border rounded text-center">
                        <p className="text-lg font-bold text-foreground">
                          {summary.features.created}
                        </p>
                        <p className="text-xs text-muted-foreground">Features</p>
                      </div>
                      <div className="p-2 bg-card border rounded text-center">
                        <p className="text-lg font-bold text-foreground">
                          {summary.userStories.created}
                        </p>
                        <p className="text-xs text-muted-foreground">User Stories</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!syncComplete && !isSyncing && (
            <Button
              onClick={handleSync}
              disabled={selectedHierarchyItems.length === 0 || !projectName}
              size="lg"
              className="w-full"
            >
              Start Sync to {targetType}
            </Button>
          )}

          {syncComplete && (
            <div className="flex gap-2">
              <Button onClick={reset} variant="outline" className="flex-1">
                Reset
              </Button>
              <Button onClick={handleSync} className="flex-1">
                Sync Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
