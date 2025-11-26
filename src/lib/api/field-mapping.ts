import { API_BASE_URL } from "@/lib/api/azure-devops";
import type { ApiResponse } from "@/types/azure-devops";
import type {
  FieldMappingConfig,
  FieldMappingTemplate,
  WorkItemTypeInfo,
  AzureDevOpsField,
} from "@/types/field-mapping";

const API_PREFIX = "/api/field-mapping";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export const fieldMappingApi = {
  /**
   * Get process template templates (system defaults)
   */
  getTemplates: async (
    processTemplateName?: string
  ): Promise<ApiResponse<FieldMappingTemplate[]>> => {
    const query = processTemplateName
      ? `?processTemplateName=${encodeURIComponent(processTemplateName)}`
      : '';
    return fetchApi<FieldMappingTemplate[]>(`/templates${query}`);
  },

  /**
   * Get all field mapping configurations for a project
   */
  getConfigs: async (
    projectId: string
  ): Promise<ApiResponse<FieldMappingConfig[]>> => {
    return fetchApi<FieldMappingConfig[]>(
      `/configs?projectId=${encodeURIComponent(projectId)}`
    );
  },

  /**
   * Get a specific field mapping configuration
   */
  getConfig: async (
    configId: string
  ): Promise<ApiResponse<FieldMappingConfig>> => {
    return fetchApi<FieldMappingConfig>(
      `/configs/${encodeURIComponent(configId)}`
    );
  },

  /**
   * Create a new field mapping configuration
   */
  createConfig: async (
    config: Omit<FieldMappingConfig, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<FieldMappingConfig>> => {
    return fetchApi<FieldMappingConfig>("/configs", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  /**
   * Update a field mapping configuration
   */
  updateConfig: async (
    configId: string,
    config: Partial<FieldMappingConfig>
  ): Promise<ApiResponse<FieldMappingConfig>> => {
    return fetchApi<FieldMappingConfig>(
      `/configs/${encodeURIComponent(configId)}`,
      {
        method: "PUT",
        body: JSON.stringify(config),
      }
    );
  },

  /**
   * Delete a field mapping configuration
   */
  deleteConfig: async (configId: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/configs/${encodeURIComponent(configId)}`, {
      method: "DELETE",
    });
  },

  /**
   * Get available work item types and their fields for a project
   */
  getWorkItemTypes: async (
    projectId: string,
    configId?: string
  ): Promise<ApiResponse<WorkItemTypeInfo[]>> => {
    const query = configId
      ? `?projectId=${encodeURIComponent(
          projectId
        )}&configId=${encodeURIComponent(configId)}`
      : `?projectId=${encodeURIComponent(projectId)}`;
    return fetchApi<WorkItemTypeInfo[]>(`/work-item-types${query}`);
  },

  /**
   * Get available Azure DevOps fields for a work item type
   */
  getFields: async (
    projectId: string,
    workItemType: string,
    configId?: string
  ): Promise<ApiResponse<AzureDevOpsField[]>> => {
    const query = configId
      ? `?projectId=${encodeURIComponent(
          projectId
        )}&workItemType=${encodeURIComponent(
          workItemType
        )}&configId=${encodeURIComponent(configId)}`
      : `?projectId=${encodeURIComponent(
          projectId
        )}&workItemType=${encodeURIComponent(workItemType)}`;
    return fetchApi<AzureDevOpsField[]>(`/fields${query}`);
  },
};
