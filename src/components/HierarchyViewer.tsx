import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Loader2, AlertCircle, Check, ChevronsUpDown } from 'lucide-react';
import { useSync, HierarchyItem } from '@/contexts/SyncContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  useArdoqWorkspaces,
  useArdoqDomains,
  useArdoqInitiatives,
  useArdoqHierarchy,
} from '@/hooks/useArdoq';
import { useToast } from '@/hooks/use-toast';
import type { HierarchyResponse, Epic, Feature, UserStory } from '@/types/ardoq';

// Helper function to transform API hierarchy to HierarchyItem format
const transformHierarchyToItems = (
  hierarchy: HierarchyResponse,
  domainId: string,
  initiativeId: string
): HierarchyItem[] => {
  try {
    const items: HierarchyItem[] = [];

    // Validate hierarchy structure
    if (!hierarchy || typeof hierarchy !== 'object') {
      throw new Error('Invalid hierarchy data structure');
    }

    // Transform epics
    if (Array.isArray(hierarchy.children)) {
      hierarchy.children.forEach((epic: Epic) => {
        if (!epic || !epic._id || !epic.name) {
          console.warn('Skipping invalid epic:', epic);
          return;
        }

        items.push({
          id: epic._id,
          name: epic.name || 'Unnamed Epic',
          type: 'epic',
          parentId: initiativeId,
          priority: epic.priority,
          description: epic.description,
        });

        // Transform features
        if (Array.isArray(epic.children)) {
          epic.children.forEach((feature: Feature) => {
            if (!feature || !feature._id || !feature.name) {
              console.warn('Skipping invalid feature:', feature);
              return;
            }

            items.push({
              id: feature._id,
              name: feature.name || 'Unnamed Feature',
              type: 'feature',
              parentId: epic._id,
              priority: feature.priority,
              description: feature.description,
            });

            // Transform user stories
            if (Array.isArray(feature.children)) {
              feature.children.forEach((story: UserStory) => {
                if (!story || !story._id || !story.name) {
                  console.warn('Skipping invalid user story:', story);
                  return;
                }

                items.push({
                  id: story._id,
                  name: story.name || 'Unnamed User Story',
                  type: 'userStory',
                  parentId: feature._id,
                  priority: story.priority,
                  description: story.description,
                });
              });
            }
          });
        }
      });
    }

    return items;
  } catch (error) {
    console.error('Error transforming hierarchy data:', error);
    throw error;
  }
};


interface HierarchyNodeProps {
  item: HierarchyItem;
  level: number;
  children: HierarchyItem[];
  allItems: HierarchyItem[];
  selectedItems: string[];
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
  isSelectionDisabled: (id: string) => boolean;
}

const HierarchyNode = ({
  item,
  level,
  children,
  allItems,
  selectedItems,
  expandedNodes,
  onToggleExpand,
  onToggleSelect,
  isSelectionDisabled,
}: HierarchyNodeProps) => {
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(item.id);
  const isSelected = selectedItems.includes(item.id);
  const disabled = isSelectionDisabled(item.id);

  const typeColors = {
    domain: 'bg-primary/10 text-primary',
    initiative: 'bg-accent/10 text-accent',
    epic: 'bg-success/10 text-success',
    feature: 'bg-warning/10 text-warning',
    userStory: 'bg-muted text-muted-foreground',
  };

  const typeLabels = {
    domain: 'Domain',
    initiative: 'Initiative',
    epic: 'Epic',
    feature: 'Feature',
    userStory: 'User Story',
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors',
          isSelected && 'bg-primary/5',
          disabled && 'opacity-50'
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

          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(item.id)}
            id={item.id}
            disabled={disabled}
          />

          <label
            htmlFor={item.id}
            className={cn(
              'flex items-center gap-2 flex-1',
              !disabled && 'cursor-pointer'
            )}
          >
            <Badge variant="outline" className={cn('text-xs', typeColors[item.type])}>
              {typeLabels[item.type]}
            </Badge>
            <span className="font-medium text-foreground">{item.name}</span>
            {item.priority && (
              <Badge variant="secondary" className="text-xs">
                {item.priority}
              </Badge>
            )}
            {item.risk && (
              <Badge variant="outline" className="text-xs">
                Risk: {item.risk}
              </Badge>
            )}
          </label>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
            <HierarchyNode
              key={child.id}
              item={child}
              level={level + 1}
              children={allItems.filter((i) => i.parentId === child.id)}
              allItems={allItems}
              selectedItems={selectedItems}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              isSelectionDisabled={isSelectionDisabled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface HierarchyViewerProps {
  onNext: () => void;
}

export const HierarchyViewer = ({ onNext }: HierarchyViewerProps) => {
  const {
    hierarchyData,
    setHierarchyData,
    selectedHierarchyItems,
    setSelectedHierarchyItems,
    toggleHierarchyItem,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    selectedDomain,
    setSelectedDomain,
    selectedInitiative,
    setSelectedInitiative,
  } = useSync();
  const { sourceConfigId } = useConnection();
  const { toast } = useToast();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [transformationError, setTransformationError] = useState<string | null>(null);

  // Retry state tracking
  const [workspacesRetryCount, setWorkspacesRetryCount] = useState(0);
  const [domainsRetryCount, setDomainsRetryCount] = useState(0);
  const [initiativesRetryCount, setInitiativesRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Workspace search state
  const [workspaceSearchOpen, setWorkspaceSearchOpen] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');

  // Fetch workspaces
  const {
    data: workspaces,
    isLoading: loadingWorkspaces,
    error: workspacesError,
    refetch: refetchWorkspaces,
  } = useArdoqWorkspaces(sourceConfigId);

  // Fetch domains for selected workspace
  const {
    data: domains,
    isLoading: loadingDomains,
    error: domainsError,
    refetch: refetchDomains,
  } = useArdoqDomains(selectedWorkspaceId, sourceConfigId);

  // Fetch initiatives for selected domain
  const {
    data: initiatives,
    isLoading: loadingInitiatives,
    error: initiativesError,
    refetch: refetchInitiatives,
  } = useArdoqInitiatives(selectedWorkspaceId, selectedDomain, sourceConfigId);

  // Fetch hierarchy for selected initiative
  const {
    data: hierarchy,
    isLoading: loadingHierarchy,
    error: hierarchyError,
  } = useArdoqHierarchy(selectedWorkspaceId, selectedInitiative, sourceConfigId);

  // Transform and update hierarchy data when hierarchy is fetched
  useEffect(() => {
    if (hierarchy && selectedDomain && selectedInitiative) {
      try {
        setTransformationError(null);
        const transformedItems = transformHierarchyToItems(
          hierarchy,
          selectedDomain,
          selectedInitiative
        );
        setHierarchyData(transformedItems);

        // Auto-expand epics when hierarchy is loaded
        const epics = transformedItems.filter((item) => item.type === 'epic');
        setExpandedNodes(new Set(epics.map((e) => e.id)));

        // Auto-select all items (epics, features, and user stories) by default
        const allItemIds = transformedItems.map((item) => item.id);
        setSelectedHierarchyItems(allItemIds);
      } catch (error) {
        console.error('Failed to transform hierarchy data:', error);
        setTransformationError(
          error instanceof Error
            ? error.message
            : 'Failed to process hierarchy data. The data structure may be incorrect.'
        );
        setHierarchyData([]);
        toast({
          title: 'Data Processing Error',
          description:
            'Unable to process the hierarchy data. Please try again or contact support if the issue persists.',
          variant: 'destructive',
        });
      }
    } else {
      setHierarchyData([]);
      setTransformationError(null);
      // Clear selections when hierarchy is cleared
      setSelectedHierarchyItems([]);
    }
  }, [hierarchy, selectedDomain, selectedInitiative, setHierarchyData, setSelectedHierarchyItems, toast]);

  // Reset retry counts when selections change
  useEffect(() => {
    if (selectedWorkspaceId) {
      setDomainsRetryCount(0);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (selectedDomain) {
      setInitiativesRetryCount(0);
    }
  }, [selectedDomain]);

  // Reset workspaces retry count when data is successfully loaded
  useEffect(() => {
    if (Array.isArray(workspaces) && workspaces.length > 0) {
      setWorkspacesRetryCount(0);
    }
  }, [workspaces]);

  // Reset domains retry count when data is successfully loaded
  useEffect(() => {
    if (Array.isArray(domains) && domains.length > 0) {
      setDomainsRetryCount(0);
    }
  }, [domains]);

  // Reset initiatives retry count when data is successfully loaded
  useEffect(() => {
    if (Array.isArray(initiatives) && initiatives.length > 0) {
      setInitiativesRetryCount(0);
    }
  }, [initiatives]);

  const handleRetryWorkspaces = async () => {
    if (workspacesRetryCount >= MAX_RETRIES) {
      toast({
        title: 'Maximum Retries Reached',
        description: 'You have reached the maximum number of retry attempts. Please check your configuration or contact support.',
        variant: 'destructive',
      });
      return;
    }
    setWorkspacesRetryCount((prev) => prev + 1);
    await refetchWorkspaces();
  };

  const handleRetryDomains = async () => {
    if (domainsRetryCount >= MAX_RETRIES) {
      toast({
        title: 'Maximum Retries Reached',
        description: 'You have reached the maximum number of retry attempts. Please try selecting a different workspace or contact support.',
        variant: 'destructive',
      });
      return;
    }
    setDomainsRetryCount((prev) => prev + 1);
    await refetchDomains();
  };

  const handleRetryInitiatives = async () => {
    if (initiativesRetryCount >= MAX_RETRIES) {
      toast({
        title: 'Maximum Retries Reached',
        description: 'You have reached the maximum number of retry attempts. Please try selecting a different domain or contact support.',
        variant: 'destructive',
      });
      return;
    }
    setInitiativesRetryCount((prev) => prev + 1);
    await refetchInitiatives();
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedDomain('');
    setSelectedInitiative('');
    setHierarchyData([]);
    setExpandedNodes(new Set());
    setDomainsRetryCount(0);
    setInitiativesRetryCount(0);
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
    setSelectedInitiative('');
    setHierarchyData([]);
    setExpandedNodes(new Set());
    setInitiativesRetryCount(0);
  };

  const handleInitiativeSelect = (initiativeId: string) => {
    setSelectedInitiative(initiativeId);
    setTransformationError(null);
  };

  const handleRetryHierarchy = () => {
    setTransformationError(null);
    const currentInitiative = selectedInitiative;
    setSelectedInitiative('');
    // Force re-fetch by resetting and re-selecting
    setTimeout(() => {
      setSelectedInitiative(currentInitiative);
    }, 100);
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

  const isSelectionDisabled = (itemId: string): boolean => {
    // All epics, features, and user stories can be selected/deselected
    // No restrictions on selection
    return false;
  };

  // Validate and transform domains to HierarchyItem format for display
  const domainItems: HierarchyItem[] = Array.isArray(domains)
    ? domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      type: 'domain' as const,
    }))
    : [];

  // Validate and transform initiatives to HierarchyItem format for display
  const initiativeItems: HierarchyItem[] = Array.isArray(initiatives)
    ? initiatives.map((initiative) => ({
      id: initiative.id,
      name: initiative.name,
      type: 'initiative' as const,
      parentId: initiative.parent,
    }))
    : [];

  // Validate workspaces is an array
  const workspacesArray = Array.isArray(workspaces) ? workspaces : [];

  // Filter workspaces based on search query
  const filteredWorkspaces = workspacesArray.filter((workspace) => {
    if (!workspaceSearchQuery) return true;
    const query = workspaceSearchQuery.toLowerCase();
    return (
      workspace.name?.toLowerCase().includes(query) ||
      workspace.description?.toLowerCase().includes(query) ||
      workspace._id?.toLowerCase().includes(query)
    );
  });

  // Get selected workspace name
  const selectedWorkspace = workspacesArray.find((w) => w._id === selectedWorkspaceId);

  // Get hierarchy items (epics) for the selected initiative
  const hierarchyItems = hierarchyData.filter(
    (item) => item.type === 'epic' && item.parentId === selectedInitiative
  );

  // Show error if workspace selection is required but not available
  if (!sourceConfigId) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Please configure and select an Ardoq configuration first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Work Items</h2>
        <p className="text-muted-foreground">
          Choose the workspace, domain, initiative, and work items you want to sync to Azure DevOps.
        </p>
      </div>

      {/* Workspace Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Workspace</CardTitle>
          <CardDescription>Choose the Ardoq workspace to sync from</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWorkspaces ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading workspaces...</span>
            </div>
          ) : workspacesError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    Failed to load workspaces
                  </p>
                </div>
                <p className="text-sm text-destructive/90">
                  {workspacesError instanceof Error ? workspacesError.message : 'Unknown error'}
                </p>
                {workspacesRetryCount < MAX_RETRIES ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryWorkspaces}
                      disabled={loadingWorkspaces}
                    >
                      {loadingWorkspaces ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        `Retry (${workspacesRetryCount}/${MAX_RETRIES})`
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum retry attempts ({MAX_RETRIES}) reached. Please check your configuration or contact support.
                  </p>
                )}
              </div>
            </div>
          ) : !Array.isArray(workspaces) ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    Invalid Data Format
                  </p>
                </div>
                <p className="text-sm text-destructive/90">
                  The workspaces data is not in the expected format. Please try again or contact support if the issue persists.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Received: {typeof workspaces} (expected: array)
                </p>
                {workspacesRetryCount < MAX_RETRIES ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryWorkspaces}
                      disabled={loadingWorkspaces}
                    >
                      {loadingWorkspaces ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        `Retry (${workspacesRetryCount}/${MAX_RETRIES})`
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum retry attempts ({MAX_RETRIES}) reached. Please check your configuration or contact support.
                  </p>
                )}
              </div>
            </div>
          ) : workspacesArray.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workspaces found.</p>
          ) : (
            <Popover open={workspaceSearchOpen} onOpenChange={setWorkspaceSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={workspaceSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedWorkspace
                    ? selectedWorkspace.name || selectedWorkspace._id
                    : 'Select a workspace...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search workspaces..."
                    value={workspaceSearchQuery}
                    onValueChange={setWorkspaceSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No workspace found.</CommandEmpty>
                    <CommandGroup>
                      {filteredWorkspaces.map((workspace) => (
                        <CommandItem
                          key={workspace._id}
                          value={`${workspace.name || workspace._id} ${workspace.description || ''} ${workspace._id}`}
                          onSelect={() => {
                            handleWorkspaceSelect(workspace._id);
                            setWorkspaceSearchOpen(false);
                            setWorkspaceSearchQuery('');
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedWorkspaceId === workspace._id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{workspace.name || workspace._id}</span>
                            {workspace.description && (
                              <span className="text-xs text-muted-foreground">
                                {workspace.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </CardContent>
      </Card>

      {/* Domain Selection */}
      {selectedWorkspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select Domain</CardTitle>
            <CardDescription>Choose the domain to sync from</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDomains ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading domains...</span>
              </div>
            ) : domainsError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Failed to load domains
                    </p>
                  </div>
                  <p className="text-sm text-destructive/90">
                    {domainsError instanceof Error ? domainsError.message : 'Unknown error'}
                  </p>
                  {domainsRetryCount < MAX_RETRIES ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryDomains}
                        disabled={loadingDomains}
                      >
                        {loadingDomains ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          `Retry (${domainsRetryCount}/${MAX_RETRIES})`
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum retry attempts ({MAX_RETRIES}) reached. Please try selecting a different workspace or contact support.
                    </p>
                  )}
                </div>
              </div>
            ) : !Array.isArray(domains) ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Invalid Data Format
                    </p>
                  </div>
                  <p className="text-sm text-destructive/90">
                    The domains data is not in the expected format. Please try again or contact support if the issue persists.
                  </p>
                  {domainsRetryCount < MAX_RETRIES ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryDomains}
                        disabled={loadingDomains}
                      >
                        {loadingDomains ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          `Retry (${domainsRetryCount}/${MAX_RETRIES})`
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum retry attempts ({MAX_RETRIES}) reached. Please try selecting a different workspace or contact support.
                    </p>
                  )}
                </div>
              </div>
            ) : domainItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No domains found in this workspace.</p>
            ) : (
              <RadioGroup value={selectedDomain} onValueChange={handleDomainSelect}>
                <div className="space-y-3">
                  {domainItems.map((domain) => (
                    <div key={domain.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={domain.id} id={domain.id} />
                      <Label htmlFor={domain.id} className="flex-1 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{domain.name}</div>
                            {domain.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {domain.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {/* Initiative Selection */}
      {selectedDomain && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Select Initiative</CardTitle>
            <CardDescription>Choose the initiative to sync from</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInitiatives ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading initiatives...</span>
              </div>
            ) : initiativesError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Failed to load initiatives
                    </p>
                  </div>
                  <p className="text-sm text-destructive/90">
                    {initiativesError instanceof Error ? initiativesError.message : 'Unknown error'}
                  </p>
                  {initiativesRetryCount < MAX_RETRIES ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryInitiatives}
                        disabled={loadingInitiatives}
                      >
                        {loadingInitiatives ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          `Retry (${initiativesRetryCount}/${MAX_RETRIES})`
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum retry attempts ({MAX_RETRIES}) reached. Please try selecting a different domain or contact support.
                    </p>
                  )}
                </div>
              </div>
            ) : !Array.isArray(initiatives) ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Invalid Data Format
                    </p>
                  </div>
                  <p className="text-sm text-destructive/90">
                    The initiatives data is not in the expected format. Please try again or contact support if the issue persists.
                  </p>
                  {initiativesRetryCount < MAX_RETRIES ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryInitiatives}
                        disabled={loadingInitiatives}
                      >
                        {loadingInitiatives ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          `Retry (${initiativesRetryCount}/${MAX_RETRIES})`
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum retry attempts ({MAX_RETRIES}) reached. Please try selecting a different domain or contact support.
                    </p>
                  )}
                </div>
              </div>
            ) : initiativeItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No initiatives found for this domain.</p>
            ) : (
              <RadioGroup value={selectedInitiative} onValueChange={handleInitiativeSelect}>
                <div className="space-y-3">
                  {initiativeItems.map((initiative) => (
                    <div key={initiative.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={initiative.id} id={initiative.id} />
                      <Label htmlFor={initiative.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{initiative.name}</span>
                          {initiative.priority && (
                            <Badge variant="secondary" className="text-xs">
                              {initiative.priority}
                            </Badge>
                          )}
                          {initiative.risk && (
                            <Badge variant="outline" className="text-xs">
                              Risk: {initiative.risk}
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hierarchy Selection */}
      {selectedInitiative && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Select Work Items</CardTitle>
            <CardDescription>
              {selectedHierarchyItems.length} items selected (epics, features, and user stories)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHierarchy ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading hierarchy...</span>
              </div>
            ) : hierarchyError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Failed to load hierarchy
                    </p>
                  </div>
                  <p className="text-sm text-destructive/90">
                    {hierarchyError instanceof Error ? hierarchyError.message : 'Unknown error occurred'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Please try again after some time. If the problem persists, check your configuration or contact support.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryHierarchy}
                    className="w-fit mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : transformationError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Data Processing Error
                    </p>
                  </div>
                  <p className="text-sm text-destructive/90">
                    {transformationError}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    The hierarchy data structure may be incorrect or incomplete. Please try again after some time, or select a different initiative.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTransformationError(null);
                        setSelectedInitiative('');
                      }}
                    >
                      Select Different Initiative
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryHierarchy}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            ) : hierarchyItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No work items found for this initiative.</p>
            ) : (
              <div className="space-y-1">
                {hierarchyItems.map((item) => (
                  <HierarchyNode
                    key={item.id}
                    item={item}
                    level={0}
                    children={hierarchyData.filter((i) => i.parentId === item.id)}
                    allItems={hierarchyData}
                    selectedItems={selectedHierarchyItems}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                    onToggleSelect={toggleHierarchyItem}
                    isSelectionDisabled={isSelectionDisabled}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={selectedHierarchyItems.length === 0 || !selectedDomain || !selectedInitiative}
          size="lg"
        >
          Continue to Sync
        </Button>
      </div>
    </div>
  );
};
