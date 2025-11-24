import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ardoqApi } from '@/lib/api/ardoq';
import type {
  ConfigurationCreateRequest,
  ConfigurationUpdateRequest,
  ArdoqConfiguration,
} from '@/types/ardoq';

// Query Keys
export const ardoqKeys = {
  all: ['ardoq'] as const,
  configurations: () => [...ardoqKeys.all, 'configurations'] as const,
  configuration: (id: string) => [...ardoqKeys.configurations(), id] as const,
  activeConfiguration: () => [...ardoqKeys.configurations(), 'active'] as const,
  workspaces: (configId?: string) => [...ardoqKeys.all, 'workspaces', configId] as const,
  workspace: (id: string, configId?: string) =>
    [...ardoqKeys.workspaces(configId), id] as const,
  workspaceContext: (id: string, configId?: string) =>
    [...ardoqKeys.workspace(id, configId), 'context'] as const,
  components: (workspaceId: string, configId?: string) =>
    [...ardoqKeys.all, 'components', workspaceId, configId] as const,
  domains: (workspaceId: string, configId?: string) =>
    [...ardoqKeys.all, 'domains', workspaceId, configId] as const,
  initiatives: (workspaceId: string, domainId: string, configId?: string) =>
    [...ardoqKeys.all, 'initiatives', workspaceId, domainId, configId] as const,
  hierarchy: (workspaceId: string, initiativeId: string, configId?: string) =>
    [...ardoqKeys.all, 'hierarchy', workspaceId, initiativeId, configId] as const,
};

// Configuration Hooks

export function useArdoqConfigurations(configId?: string) {
  return useQuery({
    queryKey: ardoqKeys.configurations(),
    queryFn: async () => {
      const response = await ardoqApi.listConfigurations(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch configurations');
      }
      return response.data;
    },
  });
}

export function useArdoqConfiguration(id: string) {
  return useQuery({
    queryKey: ardoqKeys.configuration(id),
    queryFn: async () => {
      const response = await ardoqApi.getConfiguration(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch configuration');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useActiveArdoqConfiguration() {
  return useQuery({
    queryKey: ardoqKeys.activeConfiguration(),
    queryFn: async () => {
      const response = await ardoqApi.getActiveConfiguration();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch active configuration');
      }
      return response.data;
    },
  });
}

export function useCreateArdoqConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: ConfigurationCreateRequest) => {
      const response = await ardoqApi.createConfiguration(config);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create configuration');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ardoqKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: ardoqKeys.activeConfiguration() });
    },
  });
}

export function useUpdateArdoqConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      config,
    }: {
      id: string;
      config: ConfigurationUpdateRequest;
    }) => {
      const response = await ardoqApi.updateConfiguration(id, config);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update configuration');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ardoqKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: ardoqKeys.configuration(variables.id) });
      queryClient.invalidateQueries({ queryKey: ardoqKeys.activeConfiguration() });
    },
  });
}

export function useDeleteArdoqConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await ardoqApi.deleteConfiguration(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete configuration');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ardoqKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: ardoqKeys.activeConfiguration() });
    },
  });
}

export function useActivateArdoqConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await ardoqApi.activateConfiguration(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to activate configuration');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ardoqKeys.configurations() });
      queryClient.invalidateQueries({ queryKey: ardoqKeys.activeConfiguration() });
    },
  });
}

export function useTestArdoqConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId?: string) => {
      const response = await ardoqApi.testConnection(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to test connection');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Update the configuration in cache if we have it
      if (data.configuration) {
        queryClient.setQueryData(
          ardoqKeys.configuration(data.configuration.id),
          data.configuration
        );
      }
      queryClient.invalidateQueries({ queryKey: ardoqKeys.configurations() });
    },
  });
}

// Workspace Hooks

export function useArdoqWorkspaces(configId?: string) {
  return useQuery({
    queryKey: ardoqKeys.workspaces(configId),
    queryFn: async () => {
      const response = await ardoqApi.listWorkspaces(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch workspaces');
      }
      // The API returns workspaces in data.values array
      if (response.data && typeof response.data === 'object' && 'values' in response.data) {
        return (response.data as { values: any[] }).values;
      }
      // Fallback: if data is already an array, return it directly
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If neither, return empty array
      return [];
    },
  });
}

export function useArdoqWorkspace(id: string, configId?: string) {
  return useQuery({
    queryKey: ardoqKeys.workspace(id, configId),
    queryFn: async () => {
      const response = await ardoqApi.getWorkspace(id, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch workspace');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useArdoqWorkspaceContext(id: string, configId?: string) {
  return useQuery({
    queryKey: ardoqKeys.workspaceContext(id, configId),
    queryFn: async () => {
      const response = await ardoqApi.getWorkspaceContext(id, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch workspace context');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Component Hooks

export function useArdoqComponents(workspaceId: string, configId?: string) {
  return useQuery({
    queryKey: ardoqKeys.components(workspaceId, configId),
    queryFn: async () => {
      const response = await ardoqApi.getComponents(workspaceId, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch components');
      }
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

// Hierarchy Hooks

export function useArdoqDomains(workspaceId: string, configId?: string) {
  return useQuery({
    queryKey: ardoqKeys.domains(workspaceId, configId),
    queryFn: async () => {
      const response = await ardoqApi.getDomains(workspaceId, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch domains');
      }
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

export function useArdoqInitiatives(
  workspaceId: string,
  domainId: string,
  configId?: string
) {
  return useQuery({
    queryKey: ardoqKeys.initiatives(workspaceId, domainId, configId),
    queryFn: async () => {
      const response = await ardoqApi.getInitiatives(workspaceId, domainId, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch initiatives');
      }
      return response.data;
    },
    enabled: !!workspaceId && !!domainId,
  });
}

export function useArdoqHierarchy(
  workspaceId: string,
  initiativeId: string,
  configId?: string
) {
  return useQuery({
    queryKey: ardoqKeys.hierarchy(workspaceId, initiativeId, configId),
    queryFn: async () => {
      const response = await ardoqApi.getHierarchy(workspaceId, initiativeId, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch hierarchy');
      }
      return response.data;
    },
    enabled: !!workspaceId && !!initiativeId,
  });
}

