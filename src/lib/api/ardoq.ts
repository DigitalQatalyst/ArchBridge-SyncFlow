import type {
  ApiResponse,
  ArdoqConfiguration,
  ConfigurationCreateRequest,
  ConfigurationUpdateRequest,
  CreateConfigurationResponse,
  TestConnectionResponse,
  Workspace,
  WorkspaceContext,
  WorkspacesResponse,
  Component,
  Domain,
  Initiative,
  HierarchyResponse,
} from '@/types/ardoq';

// Get API base URL from environment variable or default to localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API_PREFIX = '/api/ardoq';

/**
 * Helper function to build query string from params
 */
function buildQueryString(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([_, value]) => value !== undefined);
  if (filtered.length === 0) return '';
  return '?' + filtered.map(([key, value]) => `${key}=${encodeURIComponent(value!)}`).join('&');
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Configuration Management Endpoints

export const ardoqApi = {
  /**
   * Create a new Ardoq configuration
   */
  createConfiguration: async (
    config: ConfigurationCreateRequest
  ): Promise<ApiResponse<CreateConfigurationResponse>> => {
    return fetchApi<CreateConfigurationResponse>('/configurations', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /**
   * List all configurations
   */
  listConfigurations: async (
    configId?: string
  ): Promise<ApiResponse<ArdoqConfiguration[]>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<ArdoqConfiguration[]>(`/configurations${query}`);
  },

  /**
   * Get configuration by ID
   */
  getConfiguration: async (id: string): Promise<ApiResponse<ArdoqConfiguration>> => {
    return fetchApi<ArdoqConfiguration>(`/configurations/${id}`);
  },

  /**
   * Get active configuration
   */
  getActiveConfiguration: async (): Promise<ApiResponse<ArdoqConfiguration>> => {
    return fetchApi<ArdoqConfiguration>('/configurations/active');
  },

  /**
   * Update configuration
   */
  updateConfiguration: async (
    id: string,
    config: ConfigurationUpdateRequest
  ): Promise<ApiResponse<ArdoqConfiguration>> => {
    return fetchApi<ArdoqConfiguration>(`/configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  /**
   * Delete configuration
   */
  deleteConfiguration: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return fetchApi<{ message: string }>(`/configurations/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Activate configuration
   */
  activateConfiguration: async (id: string): Promise<ApiResponse<ArdoqConfiguration>> => {
    return fetchApi<ArdoqConfiguration>(`/configurations/${id}/activate`, {
      method: 'POST',
    });
  },

  /**
   * Test connection
   */
  testConnection: async (
    configId?: string
  ): Promise<ApiResponse<TestConnectionResponse>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    const url = `${API_BASE_URL}${API_PREFIX}/test-connection${query}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // The API returns configuration at root level, not in data
      // Transform it to match our expected structure
      return {
        success: true,
        data: {
          timestamp: data.data?.timestamp || '',
          configuration: data.configuration,
        },
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  // Workspace Endpoints

  /**
   * List all workspaces
   */
  listWorkspaces: async (configId?: string): Promise<ApiResponse<WorkspacesResponse>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<WorkspacesResponse>(`/workspaces${query}`);
  },

  /**
   * Get workspace by ID
   */
  getWorkspace: async (
    id: string,
    configId?: string
  ): Promise<ApiResponse<Workspace>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<Workspace>(`/workspaces/${id}${query}`);
  },

  /**
   * Get workspace context
   */
  getWorkspaceContext: async (
    id: string,
    configId?: string
  ): Promise<ApiResponse<WorkspaceContext>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<WorkspaceContext>(`/workspaces/${id}/context${query}`);
  },

  // Component Endpoints

  /**
   * Get all components in a workspace
   */
  getComponents: async (
    workspaceId: string,
    configId?: string
  ): Promise<ApiResponse<Component[]>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<Component[]>(`/workspaces/${workspaceId}/components${query}`);
  },

  // Hierarchy Endpoints

  /**
   * Get domains in a workspace
   */
  getDomains: async (
    workspaceId: string,
    configId?: string
  ): Promise<ApiResponse<Domain[]>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<Domain[]>(`/workspaces/${workspaceId}/domains${query}`);
  },

  /**
   * Get initiatives for a domain
   */
  getInitiatives: async (
    workspaceId: string,
    domainId: string,
    configId?: string
  ): Promise<ApiResponse<Initiative[]>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<Initiative[]>(
      `/workspaces/${workspaceId}/domains/${domainId}/initiatives${query}`
    );
  },

  /**
   * Get initiative hierarchy
   */
  getHierarchy: async (
    workspaceId: string,
    initiativeId: string,
    configId?: string
  ): Promise<ApiResponse<HierarchyResponse>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<HierarchyResponse>(
      `/workspaces/${workspaceId}/initiatives/${initiativeId}/hierarchy${query}`
    );
  },
};

