// Ardoq API Types

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// Workspaces API Response Structure
export interface WorkspacesResponse {
  _meta?: {
    warnings?: any;
    query?: {
      raw?: any;
      conformed?: any;
    };
  };
  values: Workspace[];
}

// Configuration Types
export interface ArdoqConfiguration {
  id: string;
  name: string;
  apiHost: string;
  orgLabel?: string;
  isActive: boolean;
  isTested: boolean;
  testPassed: boolean;
  testError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigurationCreateRequest {
  name: string;
  apiToken: string;
  apiHost?: string;
  orgLabel?: string;
  setActive?: boolean;
}

export interface ConfigurationUpdateRequest {
  name?: string;
  apiToken?: string;
  apiHost?: string;
  orgLabel?: string;
  isActive?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  user?: {
    email: string;
  };
  organization?: {
    name: string;
    label: string;
  };
  error?: string;
  timestamp: string;
}

export interface CreateConfigurationResponse {
  configuration: ArdoqConfiguration;
  testResult?: TestConnectionResult;
}

export interface TestConnectionResponse {
  timestamp: string;
  configuration: ArdoqConfiguration;
}

// Workspace Types
export interface Workspace {
  _id: string;
  name: string;
  [key: string]: any;
}

export interface WorkspaceContext {
  componentTypes: any[];
  referenceTypes: any[];
  [key: string]: any;
}

// Component Types
export interface Component {
  _id: string;
  name: string;
  type: string;
  parent?: string | null;
  parentId?: string | null;
  [key: string]: any;
}

// Hierarchy Types
export interface Domain {
  id: string;
  name: string;
  type: string;
}

export interface Initiative {
  id: string;
  name: string;
  type: string;
  parent: string;
}

export interface Epic {
  _id: string;
  name: string;
  type: string;
  parent: string;
  children?: Feature[];
  [key: string]: any;
}

export interface Feature {
  _id: string;
  name: string;
  type: string;
  parent: string;
  children?: UserStory[];
  [key: string]: any;
}

export interface UserStory {
  _id: string;
  name: string;
  type: string;
  parent: string;
  [key: string]: any;
}

export interface HierarchyNode {
  _id: string;
  name: string;
  type: string;
  parent: string;
  children?: HierarchyNode[];
  [key: string]: any;
}

export interface HierarchyResponse {
  _id: string;
  name: string;
  type: string;
  parent: string;
  children: Epic[];
}

