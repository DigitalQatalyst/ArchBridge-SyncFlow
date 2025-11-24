import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDevOpsApi } from '@/lib/api/azure-devops';
import type {
  ConfigurationCreateRequest,
  ConfigurationUpdateRequest,
  AzureDevOpsConfiguration,
  CreateProjectRequest,
  CreateProjectResponse,
  ProcessTemplate,
  Project,
  SyncWorkItemsRequest,
  SyncEvent,
  SyncSuccessEventData,
  SyncFailureEventData,
  SyncCompleteEventData,
  SyncErrorEventData,
  SyncSummary,
  WorkItemsCheckResponse,
  OverwriteProgressEventData,
  OverwriteErrorEventData,
} from '@/types/azure-devops';

// Query Keys
export const azureDevOpsKeys = {
  all: ['azure-devops'] as const,
  configurations: () => [...azureDevOpsKeys.all, 'configurations'] as const,
  configuration: (id: string) => [...azureDevOpsKeys.configurations(), id] as const,
  activeConfiguration: () => [...azureDevOpsKeys.configurations(), 'active'] as const,
};

// Configuration Hooks

export function useAzureDevOpsConfigurations(configId?: string) {
  return useQuery({
    queryKey: azureDevOpsKeys.configurations(),
    queryFn: async () => {
      const response = await azureDevOpsApi.listConfigurations(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch configurations');
      }
      return response.data;
    },
  });
}

export function useAzureDevOpsConfiguration(id: string) {
  return useQuery({
    queryKey: azureDevOpsKeys.configuration(id),
    queryFn: async () => {
      const response = await azureDevOpsApi.getConfiguration(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch configuration');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useActiveAzureDevOpsConfiguration() {
  return useQuery({
    queryKey: azureDevOpsKeys.activeConfiguration(),
    queryFn: async () => {
      const response = await azureDevOpsApi.getActiveConfiguration();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch active configuration');
      }
      return response.data;
    },
  });
}

export function useCreateAzureDevOpsConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: ConfigurationCreateRequest) => {
      const response = await azureDevOpsApi.createConfiguration(config);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create configuration');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.activeConfiguration() });
    },
  });
}

export function useUpdateAzureDevOpsConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      config,
    }: {
      id: string;
      config: ConfigurationUpdateRequest;
    }) => {
      const response = await azureDevOpsApi.updateConfiguration(id, config);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update configuration');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.configuration(variables.id) });
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.activeConfiguration() });
    },
  });
}

export function useDeleteAzureDevOpsConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await azureDevOpsApi.deleteConfiguration(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete configuration');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.activeConfiguration() });
    },
  });
}

export function useActivateAzureDevOpsConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await azureDevOpsApi.activateConfiguration(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to activate configuration');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.activeConfiguration() });
    },
  });
}

export function useTestAzureDevOpsConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId?: string) => {
      const response = await azureDevOpsApi.testConnection(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to test connection');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Update the configuration in cache if we have it
      if (data.configuration) {
        queryClient.setQueryData(
          azureDevOpsKeys.configuration(data.configuration.id),
          data.configuration
        );
      }
      queryClient.invalidateQueries({ queryKey: azureDevOpsKeys.configurations() });
    },
  });
}

// Process Template Hooks

export function useProcessTemplates(configId?: string) {
  return useQuery({
    queryKey: [...azureDevOpsKeys.all, 'process-templates', configId],
    queryFn: async () => {
      const response = await azureDevOpsApi.listProcessTemplates(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch process templates');
      }
      return response.data;
    },
  });
}

// Project Hooks

export function useCreateAzureDevOpsProject() {
  return useMutation({
    mutationFn: async ({
      project,
      configId,
    }: {
      project: CreateProjectRequest;
      configId?: string;
    }) => {
      const response = await azureDevOpsApi.createProject(project, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create project');
      }
      return response.data;
    },
  });
}

export function useListAzureDevOpsProjects(configId?: string) {
  return useQuery({
    queryKey: [...azureDevOpsKeys.all, 'projects', configId],
    queryFn: async () => {
      const response = await azureDevOpsApi.listProjects(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch projects');
      }
      return response.data;
    },
    enabled: !!configId,
  });
}

export function useCheckWorkItems(projectName: string | undefined, configId?: string) {
  return useQuery({
    queryKey: [...azureDevOpsKeys.all, 'work-items-check', projectName, configId],
    queryFn: async () => {
      if (!projectName) {
        throw new Error('Project name is required');
      }
      const response = await azureDevOpsApi.checkWorkItems(projectName, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to check work items');
      }
      return response.data;
    },
    enabled: !!projectName && !!configId,
  });
}

// Sync Hooks

export type ItemStatus = 'pending' | 'creating' | 'created' | 'failed';

export interface ItemProgress {
  ardoqId: string;
  name: string;
  status: ItemStatus;
  azureDevOpsId?: number;
  azureDevOpsUrl?: string;
  error?: string;
}

export interface DeletionProgress {
  isDeleting: boolean;
  total: number;
  deleted: number;
  currentChunk: number;
  totalChunks: number;
  error: string | null;
}

export interface SyncProgressState {
  isSyncing: boolean;
  itemProgress: Map<string, ItemProgress>;
  summary: SyncSummary | null;
  error: string | null;
  deletionProgress: DeletionProgress | null;
}

export function useSyncAzureDevOpsWorkItems() {
  const [state, setState] = useState<SyncProgressState>({
    isSyncing: false,
    itemProgress: new Map(),
    summary: null,
    error: null,
    deletionProgress: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const sync = useCallback(
    async (
      projectName: string,
      request: SyncWorkItemsRequest,
      configId: string | undefined,
      overwrite?: boolean
    ) => {
      // Reset state
      setState({
        isSyncing: true,
        itemProgress: new Map(),
        summary: null,
        error: null,
        deletionProgress: null,
      });

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        await azureDevOpsApi.syncWorkItems(
          projectName,
          request,
          configId,
          {
            onEvent: (event: SyncEvent) => {
              setState((prev) => {
                const newProgress = new Map(prev.itemProgress);

                // Handle overwrite/deletion events
                if (event.type === 'overwrite:started') {
                  return {
                    ...prev,
                    deletionProgress: {
                      isDeleting: true,
                      total: 0,
                      deleted: 0,
                      currentChunk: 0,
                      totalChunks: 0,
                      error: null,
                    },
                  };
                } else if (event.type === 'overwrite:deleting') {
                  const data = event.data as { count: number };
                  return {
                    ...prev,
                    deletionProgress: {
                      isDeleting: true,
                      total: data.count,
                      deleted: 0,
                      currentChunk: 0,
                      totalChunks: Math.ceil(data.count / 20),
                      error: null,
                    },
                  };
                } else if (event.type === 'overwrite:progress') {
                  const data = event.data as OverwriteProgressEventData;
                  return {
                    ...prev,
                    deletionProgress: {
                      isDeleting: true,
                      total: data.total,
                      deleted: data.deleted,
                      currentChunk: data.currentChunk,
                      totalChunks: data.totalChunks,
                      error: null,
                    },
                  };
                } else if (event.type === 'overwrite:deleted') {
                  return {
                    ...prev,
                    deletionProgress: {
                      isDeleting: false,
                      total: prev.deletionProgress?.total || 0,
                      deleted: prev.deletionProgress?.total || 0,
                      currentChunk: prev.deletionProgress?.totalChunks || 0,
                      totalChunks: prev.deletionProgress?.totalChunks || 0,
                      error: null,
                    },
                  };
                } else if (event.type === 'overwrite:no-items') {
                  return {
                    ...prev,
                    deletionProgress: {
                      isDeleting: false,
                      total: 0,
                      deleted: 0,
                      currentChunk: 0,
                      totalChunks: 0,
                      error: null,
                    },
                  };
                } else if (event.type === 'overwrite:error') {
                  const data = event.data as OverwriteErrorEventData;
                  return {
                    ...prev,
                    isSyncing: false,
                    deletionProgress: prev.deletionProgress
                      ? {
                          ...prev.deletionProgress,
                          isDeleting: false,
                          error: data.error,
                        }
                      : null,
                    error: data.error,
                  };
                }

                // Handle work item creation events
                if (
                  event.type === 'epic:created' ||
                  event.type === 'feature:created' ||
                  event.type === 'userstory:created'
                ) {
                  const data = event.data as SyncSuccessEventData;
                  newProgress.set(data.ardoqId, {
                    ardoqId: data.ardoqId,
                    name: data.name,
                    status: 'created',
                    azureDevOpsId: data.azureDevOpsId,
                    azureDevOpsUrl: data.azureDevOpsUrl,
                  });
                } else if (
                  event.type === 'epic:failed' ||
                  event.type === 'feature:failed' ||
                  event.type === 'userstory:failed'
                ) {
                  const data = event.data as SyncFailureEventData;
                  newProgress.set(data.ardoqId, {
                    ardoqId: data.ardoqId,
                    name: data.name,
                    status: 'failed',
                    error: data.error,
                  });
                } else if (event.type === 'sync:complete') {
                  const data = event.data as SyncCompleteEventData;
                  return {
                    ...prev,
                    isSyncing: false,
                    summary: data.summary,
                    deletionProgress: null, // Clear deletion progress after sync completes
                  };
                } else if (event.type === 'sync:error') {
                  const data = event.data as SyncErrorEventData;
                  return {
                    ...prev,
                    isSyncing: false,
                    error: data.error,
                  };
                }

                return {
                  ...prev,
                  itemProgress: newProgress,
                };
              });
            },
            onError: (error: Error) => {
              setState((prev) => ({
                ...prev,
                isSyncing: false,
                error: error.message,
              }));
            },
            onComplete: () => {
              setState((prev) => ({
                ...prev,
                isSyncing: false,
              }));
            },
          },
          overwrite
        );
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }));
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({
        ...prev,
        isSyncing: false,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isSyncing: false,
      itemProgress: new Map(),
      summary: null,
      error: null,
      deletionProgress: null,
    });
  }, []);

  return {
    ...state,
    sync,
    cancel,
    reset,
  };
}

