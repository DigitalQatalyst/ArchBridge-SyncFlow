// Field Mapping Types

export type WorkItemType = 'epic' | 'feature' | 'user_story';

export interface FieldMapping {
  id?: string;
  ardoqField: string; // Source field name in Ardoq
  azureDevOpsField: string; // Target field reference in Azure DevOps (e.g., "System.Description", "Microsoft.VSTS.Common.Priority")
  workItemType: WorkItemType; // Which work item type this mapping applies to
  transform?: string; // Optional transformation function (stored as string/JSON)
}

export interface FieldMappingConfig {
  id: string;
  name: string;
  description?: string;
  projectId: string; // Azure DevOps project ID this mapping is for
  projectName?: string; // Azure DevOps project name (for display)
  processTemplateName?: string; // Process template name (for reference)
  mappings: FieldMapping[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldMappingTemplate {
  id: string;
  processTemplateName: string; // 'Agile', 'Scrum', 'CMMI', 'Basic'
  processTemplateTypeId?: string; // Azure DevOps process template type ID
  name: string;
  description?: string;
  mappings: FieldMapping[];
  isSystemDefault: boolean; // Always true for templates
  createdAt?: string;
  updatedAt?: string;
}

export interface AzureDevOpsField {
  referenceName: string; // e.g., "System.Description"
  name: string; // Display name
  type: string; // Field type (String, Integer, DateTime, etc.)
  workItemTypes?: string[]; // Which work item types support this field
}

export interface WorkItemTypeInfo {
  name: string; // e.g., "Epic", "Feature", "User Story"
  referenceName: string; // e.g., "Microsoft.VSTS.WorkItemTypes.Epic"
  fields: AzureDevOpsField[]; // Available fields for this work item type
}

