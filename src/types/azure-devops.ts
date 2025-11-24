// Azure DevOps API Types

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// Configuration Types
export interface AzureDevOpsConfiguration {
  id: string;
  name: string;
  organization: string;
  isActive: boolean;
  isTested: boolean;
  testPassed: boolean;
  testError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigurationCreateRequest {
  name: string;
  organization: string;
  patToken: string;
  setActive?: boolean;
}

export interface ConfigurationUpdateRequest {
  name?: string;
  organization?: string;
  patToken?: string;
  isActive?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  state: string;
}

export interface TestConnectionResult {
  success: boolean;
  projects?: Project[];
  projectCount?: number;
  error?: string;
  timestamp: string;
}

export interface CreateConfigurationResponse {
  configuration: AzureDevOpsConfiguration;
  testResult?: TestConnectionResult;
}

export interface TestConnectionResponse {
  timestamp: string;
  configuration: AzureDevOpsConfiguration;
  projects?: Project[];
  projectCount?: number;
}

// Project Creation Types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  visibility?: 'private' | 'public';
  capabilities?: {
    processTemplate?: {
      templateTypeId: string;
    };
    versioncontrol?: {
      sourceControlType: 'Git' | 'Tfvc';
    };
  };
}

export interface ProjectOperation {
  id: string;
  status: string;
  url: string;
  _links?: {
    self?: {
      href: string;
    };
  };
}

export interface CreateProjectResponse {
  id: string;
  status: string;
  url: string;
  _links?: {
    self?: {
      href: string;
    };
  };
}

// Process Template Types
export interface ProcessTemplate {
  typeId: string;
  name: string;
  description: string;
  isDefault: boolean;
  isEnabled: boolean;
}

// Sync Progress Types
export type SyncEventType =
  | 'epic:created'
  | 'feature:created'
  | 'userstory:created'
  | 'epic:failed'
  | 'feature:failed'
  | 'userstory:failed'
  | 'sync:complete'
  | 'sync:error'
  | 'overwrite:started'
  | 'overwrite:deleting'
  | 'overwrite:progress'
  | 'overwrite:deleted'
  | 'overwrite:no-items'
  | 'overwrite:error';

export interface SyncSuccessEventData {
  ardoqId: string;
  name: string;
  azureDevOpsId?: number;
  azureDevOpsUrl?: string;
  timestamp: string;
}

export interface SyncFailureEventData {
  ardoqId: string;
  name: string;
  error: string;
  timestamp: string;
}

export interface SyncSummary {
  total: number;
  created: number;
  failed: number;
  epics: { total: number; created: number; failed: number };
  features: { total: number; created: number; failed: number };
  userStories: { total: number; created: number; failed: number };
}

export interface SyncCompleteEventData {
  summary: SyncSummary;
  timestamp: string;
}

export interface SyncErrorEventData {
  error: string;
  timestamp: string;
}

export interface OverwriteStartedEventData {
  message: string;
  timestamp: string;
}

export interface OverwriteDeletingEventData {
  message: string;
  count: number;
  timestamp: string;
}

export interface OverwriteProgressEventData {
  message: string;
  deleted: number;
  total: number;
  currentChunk: number;
  totalChunks: number;
  timestamp: string;
}

export interface OverwriteDeletedEventData {
  message: string;
  count: number;
  timestamp: string;
}

export interface OverwriteNoItemsEventData {
  message: string;
  timestamp: string;
}

export interface OverwriteErrorEventData {
  error: string;
  message: string;
  timestamp: string;
}

export interface SyncEvent {
  type: SyncEventType;
  data:
    | SyncSuccessEventData
    | SyncFailureEventData
    | SyncCompleteEventData
    | SyncErrorEventData
    | OverwriteStartedEventData
    | OverwriteDeletingEventData
    | OverwriteProgressEventData
    | OverwriteDeletedEventData
    | OverwriteNoItemsEventData
    | OverwriteErrorEventData;
}

// Work Item Sync Request Types
export interface EpicSyncItem {
  _id: string;
  name: string;
  type: string;
  description?: string;
  children?: FeatureSyncItem[];
  [key: string]: any;
}

export interface FeatureSyncItem {
  _id: string;
  name: string;
  type: string;
  description?: string;
  children?: UserStorySyncItem[];
  [key: string]: any;
}

export interface UserStorySyncItem {
  _id: string;
  name: string;
  type: string;
  description?: string;
  [key: string]: any;
}

export interface SyncWorkItemsRequest {
  epics: EpicSyncItem[];
}

// Work Items Check Types
export interface WorkItemsCheckResponse {
  hasWorkItems: boolean;
  count: number;
  workItemIds: number[];
}

