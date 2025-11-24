import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { azureDevOpsApi } from '@/lib/api/azure-devops';
import type {
  ConfigurationCreateRequest,
  ConfigurationUpdateRequest,
  AzureDevOpsConfiguration,
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

