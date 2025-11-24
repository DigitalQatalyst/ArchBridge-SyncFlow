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

