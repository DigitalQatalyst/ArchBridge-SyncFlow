import { useQuery } from '@tanstack/react-query';
import { syncHistoryApi } from '@/lib/api/sync-history';
import type {
  SyncHistoryFilters,
  SyncHistoryItemsFilters,
  AuditLogFilters,
  SyncHistory,
  SyncHistoryItem,
  AuditLog,
  SyncHistoryStats,
  AuditLogStats,
} from '@/types/sync-history';

// Query Keys
export const syncHistoryKeys = {
  all: ['sync-history'] as const,
  lists: () => [...syncHistoryKeys.all, 'list'] as const,
  list: (filters?: SyncHistoryFilters) => [...syncHistoryKeys.lists(), filters] as const,
  details: () => [...syncHistoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...syncHistoryKeys.details(), id] as const,
  items: (id: string) => [...syncHistoryKeys.detail(id), 'items'] as const,
  itemsList: (id: string, filters?: SyncHistoryItemsFilters) =>
    [...syncHistoryKeys.items(id), filters] as const,
  stats: () => [...syncHistoryKeys.all, 'stats'] as const,
  statsWithDates: (startDate?: string, endDate?: string) =>
    [...syncHistoryKeys.stats(), startDate, endDate] as const,
};

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters?: AuditLogFilters) => [...auditLogKeys.lists(), filters] as const,
  stats: () => [...auditLogKeys.all, 'stats'] as const,
  statsWithDates: (startDate?: string, endDate?: string) =>
    [...auditLogKeys.stats(), startDate, endDate] as const,
};

// Sync History Hooks

export function useSyncHistoryList(filters?: SyncHistoryFilters) {
  return useQuery({
    queryKey: syncHistoryKeys.list(filters),
    queryFn: async () => {
      const response = await syncHistoryApi.listSyncHistory(filters);
      if (!response.success) {
        throw new Error('Failed to fetch sync history');
      }
      // Response structure: { success: true, data: SyncHistory[], pagination: {...} }
      return response;
    },
  });
}

export function useSyncHistory(id: string | undefined) {
  return useQuery({
    queryKey: syncHistoryKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('Sync history ID is required');
      const response = await syncHistoryApi.getSyncHistory(id);
      // getSyncHistory throws on error, so if we get here, response is valid
      // Response structure: { success: true, data: SyncHistory }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSyncHistoryItems(id: string | undefined, filters?: SyncHistoryItemsFilters) {
  return useQuery({
    queryKey: syncHistoryKeys.itemsList(id!, filters),
    queryFn: async () => {
      if (!id) throw new Error('Sync history ID is required');
      const response = await syncHistoryApi.getSyncHistoryItems(id, filters);
      if (!response.success) {
        throw new Error('Failed to fetch sync history items');
      }
      // Response structure: { success: true, data: SyncHistoryItem[], pagination: {...} }
      return response;
    },
    enabled: !!id,
  });
}

export function useSyncHistoryStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: syncHistoryKeys.statsWithDates(startDate, endDate),
    queryFn: async () => {
      return await syncHistoryApi.getSyncHistoryStats(startDate, endDate);
    },
  });
}

// Audit Log Hooks

export function useAuditLogsList(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: async () => {
      const response = await syncHistoryApi.listAuditLogs(filters);
      if (!response.success) {
        throw new Error('Failed to fetch audit logs');
      }
      // Response structure: { success: true, data: AuditLog[], pagination: {...} }
      return response;
    },
  });
}

export function useAuditLogStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: auditLogKeys.statsWithDates(startDate, endDate),
    queryFn: async () => {
      return await syncHistoryApi.getAuditLogStats(startDate, endDate);
    },
  });
}

