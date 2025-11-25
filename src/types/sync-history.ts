// Sync History Types

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type ItemType = 'epic' | 'feature' | 'user_story';
export type ItemStatus = 'created' | 'failed' | 'skipped';
export type ActionType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'sync_cancelled'
  | 'config_created'
  | 'config_updated'
  | 'config_deleted'
  | 'config_activated'
  | 'connection_tested';

export interface SyncHistory {
  id: string;
  source_type: string;
  source_config_id?: string;
  target_type: string;
  target_config_id?: string;
  project_name: string;
  status: SyncStatus;
  overwrite_mode: boolean;
  total_items: number;
  items_created: number;
  items_failed: number;
  epics_created: number;
  epics_failed: number;
  features_created: number;
  features_failed: number;
  user_stories_created: number;
  user_stories_failed: number;
  deletion_count: number;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncHistoryItem {
  id: string;
  sync_history_id: string;
  ardoq_id: string;
  item_name: string;
  item_type: ItemType;
  status: ItemStatus;
  azure_devops_id?: number;
  azure_devops_url?: string;
  error_message?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action_type: ActionType;
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  source_ip?: string;
  user_agent?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SyncHistoryFilters {
  status?: SyncStatus;
  source_type?: string;
  target_type?: string;
  start_date?: string;
  end_date?: string;
  project_name?: string;
  limit?: number;
  offset?: number;
}

export interface SyncHistoryItemsFilters {
  status?: ItemStatus;
  item_type?: ItemType;
  limit?: number;
  offset?: number;
}

export interface AuditLogFilters {
  action_type?: ActionType;
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface SyncHistoryListResponse {
  success: boolean;
  data: SyncHistory[];
  pagination: PaginationInfo;
}

export interface SyncHistoryResponse {
  success: boolean;
  data: SyncHistory;
}

export interface SyncHistoryItemsResponse {
  success: boolean;
  data: SyncHistoryItem[];
  pagination: PaginationInfo;
}

export interface AuditLogListResponse {
  success: boolean;
  data: AuditLog[];
  pagination: PaginationInfo;
}

export interface SyncHistoryStats {
  total_syncs: number;
  completed_syncs: number;
  failed_syncs: number;
  cancelled_syncs: number;
  success_rate: number;
  average_duration_ms: number;
  total_items_created: number;
  total_items_failed: number;
}

export interface AuditLogStats {
  total_events: number;
  events_today: number;
  action_type_counts: Record<ActionType, number>;
}

export interface SyncHistoryStatsResponse {
  success: boolean;
  data: SyncHistoryStats;
}

export interface AuditLogStatsResponse {
  success: boolean;
  data: AuditLogStats;
}

