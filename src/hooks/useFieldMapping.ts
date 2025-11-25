import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldMappingApi } from '@/lib/api/field-mapping';
import type { FieldMappingConfig, WorkItemTypeInfo } from '@/types/field-mapping';
import { useToast } from '@/hooks/use-toast';

const fieldMappingKeys = {
  all: ['field-mapping'] as const,
  configs: (projectId: string) => [...fieldMappingKeys.all, 'configs', projectId] as const,
  config: (configId: string) => [...fieldMappingKeys.all, 'config', configId] as const,
  workItemTypes: (projectId: string, configId?: string) => 
    [...fieldMappingKeys.all, 'work-item-types', projectId, configId] as const,
};

export function useFieldMappingConfigs(projectId: string | undefined) {
  return useQuery({
    queryKey: projectId ? fieldMappingKeys.configs(projectId) : ['field-mapping', 'configs', 'disabled'],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const response = await fieldMappingApi.getConfigs(projectId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch field mapping configs');
      }
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useFieldMappingConfig(configId: string | undefined) {
  return useQuery({
    queryKey: configId ? fieldMappingKeys.config(configId) : ['field-mapping', 'config', 'disabled'],
    queryFn: async () => {
      if (!configId) throw new Error('Config ID is required');
      const response = await fieldMappingApi.getConfig(configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch field mapping config');
      }
      return response.data;
    },
    enabled: !!configId,
  });
}

export function useWorkItemTypes(projectId: string | undefined, configId?: string) {
  return useQuery({
    queryKey: projectId ? fieldMappingKeys.workItemTypes(projectId, configId) : ['field-mapping', 'work-item-types', 'disabled'],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const response = await fieldMappingApi.getWorkItemTypes(projectId, configId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch work item types');
      }
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateFieldMappingConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Omit<FieldMappingConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fieldMappingApi.createConfig(config);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create field mapping config');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fieldMappingKeys.configs(data.projectId) });
      toast({
        title: 'Success',
        description: 'Field mapping configuration created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateFieldMappingConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ configId, config }: { configId: string; config: Partial<FieldMappingConfig> }) => {
      const response = await fieldMappingApi.updateConfig(configId, config);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update field mapping config');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fieldMappingKeys.config(data.id) });
      queryClient.invalidateQueries({ queryKey: fieldMappingKeys.configs(data.projectId) });
      toast({
        title: 'Success',
        description: 'Field mapping configuration updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteFieldMappingConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ configId, projectId }: { configId: string; projectId: string }) => {
      const response = await fieldMappingApi.deleteConfig(configId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete field mapping config');
      }
      return { configId, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: fieldMappingKeys.configs(projectId) });
      toast({
        title: 'Success',
        description: 'Field mapping configuration deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

