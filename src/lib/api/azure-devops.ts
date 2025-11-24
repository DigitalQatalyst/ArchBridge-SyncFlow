import type {
  ApiResponse,
  AzureDevOpsConfiguration,
  ConfigurationCreateRequest,
  ConfigurationUpdateRequest,
  CreateConfigurationResponse,
  TestConnectionResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  ProcessTemplate,
  SyncWorkItemsRequest,
  SyncEvent,
  SyncEventType,
} from '@/types/azure-devops';

// Get API base URL from environment variable or default to localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API_PREFIX = '/api/azure-devops';

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

export const azureDevOpsApi = {
  /**
   * Create a new Azure DevOps configuration
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
  ): Promise<ApiResponse<AzureDevOpsConfiguration[]>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<AzureDevOpsConfiguration[]>(`/configurations${query}`);
  },

  /**
   * Get configuration by ID
   */
  getConfiguration: async (id: string): Promise<ApiResponse<AzureDevOpsConfiguration>> => {
    return fetchApi<AzureDevOpsConfiguration>(`/configurations/${id}`);
  },

  /**
   * Get active configuration
   */
  getActiveConfiguration: async (): Promise<ApiResponse<AzureDevOpsConfiguration>> => {
    return fetchApi<AzureDevOpsConfiguration>('/configurations/active');
  },

  /**
   * Update configuration
   */
  updateConfiguration: async (
    id: string,
    config: ConfigurationUpdateRequest
  ): Promise<ApiResponse<AzureDevOpsConfiguration>> => {
    return fetchApi<AzureDevOpsConfiguration>(`/configurations/${id}`, {
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
  activateConfiguration: async (id: string): Promise<ApiResponse<AzureDevOpsConfiguration>> => {
    return fetchApi<AzureDevOpsConfiguration>(`/configurations/${id}/activate`, {
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
          projects: data.data?.projects,
          projectCount: data.data?.projectCount,
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

  /**
   * List available process templates
   */
  listProcessTemplates: async (
    configId?: string
  ): Promise<ApiResponse<ProcessTemplate[]>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<ProcessTemplate[]>(`/processes${query}`);
  },

  /**
   * Create a new Azure DevOps project
   */
  createProject: async (
    project: CreateProjectRequest,
    configId?: string
  ): Promise<ApiResponse<CreateProjectResponse>> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    return fetchApi<CreateProjectResponse>(`/projects${query}`, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  /**
   * Sync work items using Server-Sent Events (SSE)
   * This method streams progress updates in real-time
   */
  syncWorkItems: async (
    projectName: string,
    request: SyncWorkItemsRequest,
    configId: string | undefined,
    callbacks: {
      onEvent?: (event: SyncEvent) => void;
      onError?: (error: Error) => void;
      onComplete?: () => void;
    }
  ): Promise<void> => {
    const query = buildQueryString(configId ? { configId } : undefined);
    const url = `${API_BASE_URL}${API_PREFIX}/projects/${encodeURIComponent(projectName)}/workitems${query}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType: SyncEventType | null = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          callbacks.onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.startsWith('event:')) {
            currentEventType = line.substring(6).trim() as SyncEventType;
          } else if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr && currentEventType) {
              try {
                const parsedData = JSON.parse(dataStr);
                // Handle both formats: { type, data } or just { data }
                const event: SyncEvent = parsedData.type
                  ? parsedData
                  : {
                      type: currentEventType,
                      data: parsedData.data || parsedData,
                    };
                callbacks.onEvent?.(event);
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError, dataStr);
              }
            }
            currentEventType = null;
          } else if (line === '') {
            // Empty line indicates end of event
            currentEventType = null;
          }
        }
      }
    } catch (error) {
      callbacks.onError?.(
        error instanceof Error ? error : new Error('Unknown error occurred')
      );
      throw error;
    }
  },
};

