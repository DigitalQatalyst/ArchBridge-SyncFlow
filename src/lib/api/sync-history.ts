import type {
  ApiResponse,
  SyncHistory,
  SyncHistoryItem,
  AuditLog,
  SyncHistoryFilters,
  SyncHistoryItemsFilters,
  AuditLogFilters,
  SyncHistoryListResponse,
  SyncHistoryResponse,
  SyncHistoryItemsResponse,
  AuditLogListResponse,
  SyncHistoryStats,
  AuditLogStats,
  SyncHistoryStatsResponse,
  AuditLogStatsResponse,
  PaginationInfo,
} from '@/types/sync-history';

// Get API base URL from environment variable or default to localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API_PREFIX = '/api';

/**
 * Helper function to build query string from params
 */
function buildQueryString(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([_, value]) => value !== undefined && value !== '');
  if (filtered.length === 0) return '';
  return (
    '?' +
    filtered
      .map(([key, value]) => `${key}=${encodeURIComponent(value!.toString())}`)
      .join('&')
  );
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
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

export const syncHistoryApi = {
  /**
   * List all sync history records
   */
  listSyncHistory: async (
    filters?: SyncHistoryFilters
  ): Promise<SyncHistoryListResponse> => {
    const query = buildQueryString(filters);
    const response = await fetchApi<SyncHistoryListResponse>(`/sync-history${query}`);
    if (!response.success) {
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
          has_more: false,
        },
      };
    }
    // Backend returns { success: true, data: SyncHistory[], pagination: {...} }
    return response as SyncHistoryListResponse;
  },

  /**
   * Get detailed sync history record by ID
   */
  getSyncHistory: async (id: string): Promise<SyncHistoryResponse> => {
    const response = await fetchApi<SyncHistoryResponse>(`/sync-history/${id}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch sync history');
    }
    // Backend returns { success: true, data: SyncHistory }
    return response as SyncHistoryResponse;
  },

  /**
   * Get all items for a specific sync history record
   */
  getSyncHistoryItems: async (
    id: string,
    filters?: SyncHistoryItemsFilters
  ): Promise<SyncHistoryItemsResponse> => {
    const query = buildQueryString(filters);
    const response = await fetchApi<SyncHistoryItemsResponse>(`/sync-history/${id}/items${query}`);
    if (!response.success) {
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          limit: filters?.limit || 100,
          offset: filters?.offset || 0,
          has_more: false,
        },
      };
    }
    // Backend returns { success: true, data: SyncHistoryItem[], pagination: {...} }
    return response as SyncHistoryItemsResponse;
  },

  /**
   * Get sync history statistics
   */
  getSyncHistoryStats: async (
    startDate?: string,
    endDate?: string
  ): Promise<SyncHistoryStats> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const query = buildQueryString(params);
    const response = await fetchApi<SyncHistoryStatsResponse>(`/sync-history/stats${query}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch sync history stats');
    }
    // Backend returns { success: true, data: SyncHistoryStats }
    return (response as SyncHistoryStatsResponse).data;
  },

  /**
   * List audit log entries
   */
  listAuditLogs: async (filters?: AuditLogFilters): Promise<AuditLogListResponse> => {
    const query = buildQueryString(filters);
    const response = await fetchApi<AuditLogListResponse>(`/audit-logs${query}`);
    if (!response.success) {
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
          has_more: false,
        },
      };
    }
    // Backend returns { success: true, data: AuditLog[], pagination: {...} }
    return response as AuditLogListResponse;
  },

  /**
   * Get audit log statistics
   */
  getAuditLogStats: async (
    startDate?: string,
    endDate?: string
  ): Promise<AuditLogStats> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const query = buildQueryString(params);
    const response = await fetchApi<AuditLogStatsResponse>(`/audit-logs/stats${query}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch audit log stats');
    }
    // Backend returns { success: true, data: AuditLogStats }
    return (response as AuditLogStatsResponse).data;
  },
};

