import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, AlertCircle, Map } from 'lucide-react';
import { useListAzureDevOpsProjects, useAzureDevOpsConfigurations } from '@/hooks/useAzureDevOps';
import { useFieldMappingConfigs } from '@/hooks/useFieldMapping';
import { FieldMappingConfigList } from '@/components/field-mapping/FieldMappingConfigList';
import { FieldMappingConfigForm } from '@/components/field-mapping/FieldMappingConfigForm';

export default function FieldMapping() {
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: configurations, isLoading: loadingConfigs } = useAzureDevOpsConfigurations();
  const { data: projects, isLoading: loadingProjects, error: projectsError } =
    useListAzureDevOpsProjects(selectedConfigId || undefined);

  const selectedProject = projects?.find((p) => p.id === selectedProjectId || p.name === selectedProjectId);

  const {
    data: configs,
    isLoading: loadingFieldMappingConfigs,
    error: configsError,
  } = useFieldMappingConfigs(selectedProjectId);

  // Reset project selection when config changes
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    setSelectedProjectId('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Field Mapping</h1>
        <p className="text-muted-foreground mt-2">
          Configure how Ardoq fields map to Azure DevOps work item fields for each project.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Configuration and Project</CardTitle>
          <CardDescription>
            Choose an Azure DevOps configuration and project to manage field mappings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Azure DevOps Configuration Selection */}
          <div className="space-y-2">
            <Label htmlFor="config-select">Azure DevOps Configuration</Label>
            {loadingConfigs ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading configurations...</span>
              </div>
            ) : !configurations || configurations.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No Azure DevOps configurations found. Please create a configuration first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedConfigId} onValueChange={handleConfigChange}>
                <SelectTrigger id="config-select">
                  <SelectValue placeholder="Select an Azure DevOps configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configurations.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                      {config.isActive && ' (Active)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Project Selection */}
          {selectedConfigId && (
            <div className="space-y-2">
              <Label htmlFor="project-select">Azure DevOps Project</Label>
              {loadingProjects ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading projects...</span>
                </div>
              ) : projectsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load projects: {projectsError instanceof Error ? projectsError.message : 'Unknown error'}
                  </AlertDescription>
                </Alert>
              ) : !projects || projects.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No projects found for this configuration. Please create a project first in the workflow.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger id="project-select">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Field Mapping Configurations */}
          {selectedProjectId && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Field Mapping Configurations</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage field mappings for project: <strong>{selectedProject?.name}</strong>
                  </p>
                </div>
                <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Mapping
                </Button>
              </div>

              {showCreateForm ? (
                <FieldMappingConfigForm
                  projectId={selectedProjectId}
                  projectName={selectedProject?.name}
                  onSuccess={() => {
                    setShowCreateForm(false);
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              ) : (
                <FieldMappingConfigList
                  projectId={selectedProjectId}
                  configs={configs}
                  isLoading={loadingFieldMappingConfigs}
                  error={configsError}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

