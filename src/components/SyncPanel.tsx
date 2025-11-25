import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, ExternalLink, X, Copy, Sparkles, Trophy, Clock, Package, Layers, FileText, Zap, ChevronDown, ChevronRight, History } from 'lucide-react';
import { useSync, HierarchyItem } from '@/contexts/SyncContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSyncAzureDevOpsWorkItems, ItemProgress } from '@/hooks/useAzureDevOps';
import { transformHierarchyToSyncFormat } from '@/lib/sync-helpers';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const { selectedHierarchyItems, hierarchyData, resetSync } = useSync();
  const {
    sourceType,
    targetType,
    projectName,
    targetConfigId,
    overwriteMode,
    fieldMappingConfigId,
    resetConnection,
  } = useConnection();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showProgressTree, setShowProgressTree] = useState(false);
  const [completionTimestamp, setCompletionTimestamp] = useState<Date | null>(null);

  const {
    isSyncing,
    itemProgress,
    summary,
    error: syncError,
    deletionProgress,
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
      setShowProgressTree(true);
    }
  }, [isSyncing, hierarchyData, selectedHierarchyItems]);

  // Track completion timestamp and collapse progress tree
  useEffect(() => {
    if (summary && !isSyncing) {
      setCompletionTimestamp(new Date());
      setShowProgressTree(false);
    }
  }, [summary, isSyncing]);

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
      // Include field mapping config ID if selected
      if (fieldMappingConfigId) {
        syncRequest.fieldMappingConfigId = fieldMappingConfigId;
      }
      await sync(projectName, syncRequest, targetConfigId, overwriteMode);
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
  const syncSuccessful = syncComplete && summary && summary.failed === 0;

  const handleStartNewSync = () => {
    reset();
    resetSync();
    resetConnection();
    setExpandedNodes(new Set());
    setShowProgressTree(false);
    setCompletionTimestamp(null);
    // Navigate to workflow start by reloading the page
    navigate('/workflow', { replace: true });
    window.location.reload();
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const summaryText = `Sync Summary:
Total: ${summary.total}
Created: ${summary.created}
Failed: ${summary.failed}
Epics: ${summary.epics.created}/${summary.epics.total}
Features: ${summary.features.created}/${summary.features.total}
User Stories: ${summary.userStories.created}/${summary.userStories.total}`;
    navigator.clipboard.writeText(summaryText);
    toast({
      title: 'Summary Copied',
      description: 'Sync summary has been copied to clipboard.',
    });
  };

  return (
    <div className="space-y-6">
      {!syncComplete && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Sync</h2>
          <p className="text-muted-foreground">
            Review your selection and start the synchronization process.
          </p>
        </div>
      )}

      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Sync Summary
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Synchronizing from <span className="font-semibold text-foreground">{sourceType}</span> to <span className="font-semibold text-foreground">{targetType}</span>
                {projectName && (
                  <span className="ml-2 text-primary font-medium">(Project: {projectName})</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Sync Overview */}

          <div className="mt-4">
            <p><span className="text-4xl font-bold text-foreground">{totalItems}</span> items ready to sync</p>
          </div>

          {/* Enhanced Items Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-lg text-foreground">Items to Sync</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(itemsByType).map(([type, count]) => {
                const typeIcons: Record<string, React.ReactNode> = {
                  epic: <Layers className="w-5 h-5" />,
                  feature: <Package className="w-5 h-5" />,
                  userStory: <FileText className="w-5 h-5" />,
                };

                const getColorClass = (itemType: string): string => {
                  if (itemType === 'epic') {
                    return 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
                  } else if (itemType === 'feature') {
                    return 'from-blue-50 via-purple-50 to-orange-50 dark:from-blue-950 dark:via-purple-950 dark:to-orange-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
                  } else {
                    return 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300';
                  }
                };

                const icon = typeIcons[type] || <Package className="w-5 h-5" />;
                const colorClass = getColorClass(type);

                return (
                  <div
                    key={type}
                    className={cn(
                      'relative overflow-hidden rounded-lg bg-gradient-to-br border-2 p-4 transition-smooth hover:shadow-lg hover:scale-105',
                      colorClass
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md bg-white/50 dark:bg-black/20">
                          {icon}
                        </div>
                        <span className="text-sm font-semibold capitalize">
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {deletionProgress?.isDeleting && (
            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Deleting existing work items...
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={cancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
              {deletionProgress.total > 0 && (
                <>
                  <Progress
                    value={(deletionProgress.deleted / deletionProgress.total) * 100}
                    className="h-2 transition-all duration-300"
                  />
                  <div className="flex items-center justify-between text-xs text-orange-600 dark:text-orange-400">
                    <span>
                      Deleted {deletionProgress.deleted} of {deletionProgress.total} work items
                    </span>
                    {deletionProgress.totalChunks > 0 && (
                      <span>
                        Chunk {deletionProgress.currentChunk} of {deletionProgress.totalChunks}
                      </span>
                    )}
                  </div>
                </>
              )}
              {deletionProgress.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{deletionProgress.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {isSyncing && !deletionProgress?.isDeleting && (
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
              <Progress value={progressPercentage} className="h-2 transition-all duration-300" />
              <p className="text-xs text-muted-foreground text-right">
                {createdCount + failedCount} of {totalItems} items processed ({Math.round(progressPercentage)}%)
              </p>
            </div>
          )}

          {((isSyncing && showProgressTree) || (syncComplete && showProgressTree)) && epics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Progress:</h4>
                {syncComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProgressTree(!showProgressTree)}
                  >
                    {showProgressTree ? 'Hide Details' : 'Show Details'}
                  </Button>
                )}
              </div>
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
            <div className="space-y-6 animate-fade-in">
              {syncSuccessful ? (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 p-8 animate-scale-in">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 dark:bg-green-800 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400 relative animate-checkmark" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                        <Trophy className="w-8 h-8" />
                        Sync Completed Successfully!
                      </h3>
                      <p className="text-lg text-green-600 dark:text-green-400">
                        All {summary.created} items have been synced to {targetType}
                      </p>
                      {completionTimestamp && (
                        <p className="text-sm text-green-500 dark:text-green-500 flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4" />
                          Completed at {completionTimestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <AlertCircle className="w-6 h-6 text-warning" />
                    <div>
                      <p className="font-semibold text-warning">Sync Completed with Issues</p>
                      <p className="text-sm text-warning/80">
                        {summary.created} succeeded, {summary.failed} failed
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800 text-center transition-smooth hover:shadow-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {summary.created}
                      </p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">Successful</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800 text-center transition-smooth hover:shadow-lg">
                      <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {summary.failed}
                      </p>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">Failed</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border-2 text-center transition-smooth hover:shadow-lg">
                      <p className="text-3xl font-bold text-foreground">{summary.total}</p>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Total</p>
                    </div>
                  </div>
                  {summary.epics && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-foreground">Breakdown by Type:</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-800 p-4 text-center transition-smooth hover:shadow-lg hover:scale-105">
                          <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.epics.created}</p>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">Epics</p>
                        </div>
                        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 dark:from-blue-950 dark:via-purple-950 dark:to-orange-950 border-2 border-blue-200 dark:border-blue-800 p-4 text-center transition-smooth hover:shadow-lg hover:scale-105">
                          <Package className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {summary.features.created}
                          </p>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">Features</p>
                        </div>
                        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-2 border-orange-200 dark:border-orange-800 p-4 text-center transition-smooth hover:shadow-lg hover:scale-105">
                          <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {summary.userStories.created}
                          </p>
                          <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1">User Stories</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Statistics - Always shown for successful sync */}
              {syncSuccessful && summary && (
                <div className="space-y-4 animate-slide-up">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-lg text-foreground">Sync Statistics</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-800 p-6 text-center transition-smooth hover:shadow-xl hover:scale-105">
                      <div className="absolute top-2 right-2 w-16 h-16 bg-blue-200 dark:bg-blue-800 rounded-full blur-2xl opacity-30"></div>
                      <div className="relative">
                        <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{summary.epics?.created || 0}</p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2">Epics</p>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 dark:from-blue-950 dark:via-purple-950 dark:to-orange-950 border-2 border-blue-200 dark:border-blue-800 p-6 text-center transition-smooth hover:shadow-xl hover:scale-105">
                      <div className="absolute top-2 right-2 w-16 h-16 bg-blue-200 dark:bg-blue-800 rounded-full blur-2xl opacity-30"></div>
                      <div className="relative">
                        <Package className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{summary.features?.created || 0}</p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2">Features</p>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-2 border-orange-200 dark:border-orange-800 p-6 text-center transition-smooth hover:shadow-xl hover:scale-105">
                      <div className="absolute top-2 right-2 w-16 h-16 bg-orange-200 dark:bg-orange-800 rounded-full blur-2xl opacity-30"></div>
                      <div className="relative">
                        <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
                        <p className="text-4xl font-bold text-orange-700 dark:text-orange-300">{summary.userStories?.created || 0}</p>
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-2">User Stories</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {syncComplete && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t animate-slide-up">
                  {syncSuccessful && (
                    <Button
                      variant="outline"
                      onClick={() => setShowProgressTree(!showProgressTree)}
                      className="flex-1"
                    >
                      {showProgressTree ? 'Hide Details' : 'Show Details'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCopySummary}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Summary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/sync-history')}
                    className="flex-1"
                  >
                    <History className="w-4 h-4 mr-2" />
                    View Sync History
                  </Button>
                  {projectName && (
                    <Button
                      variant="outline"
                      asChild
                      className="flex-1"
                    >
                      <a
                        href={`https://dev.azure.com/${targetConfigId ? 'org' : ''}/_projects`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View in Azure DevOps
                      </a>
                    </Button>
                  )}
                  <Button
                    onClick={handleStartNewSync}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start New Sync
                  </Button>
                </div>
              )}
            </div>
          )}

          {!syncComplete && !isSyncing && (
            <Button
              onClick={handleSync}
              disabled={selectedHierarchyItems.length === 0 || !projectName}
              size="lg"
              className="w-full transition-smooth"
            >
              Start Sync to {targetType}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
