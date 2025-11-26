import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Map, ExternalLink } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { useFieldMappingConfigs, useFieldMappingTemplates } from '@/hooks/useFieldMapping';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FieldMappingSelectionStepProps {
  onNext: () => void;
}

export function FieldMappingSelectionStep({ onNext }: FieldMappingSelectionStepProps) {
  const { 
    projectName, 
    targetConfigId, 
    setFieldMappingConfigId, 
    fieldMappingConfigId,
    setProcessTemplateTemplateName,
    processTemplateTemplateName,
  } = useConnection();
  const navigate = useNavigate();
  const [mappingType, setMappingType] = useState<'template' | 'project' | 'none'>(
    processTemplateTemplateName ? 'template' : fieldMappingConfigId ? 'project' : 'none'
  );
  const [selectedConfigId, setSelectedConfigId] = useState<string>(fieldMappingConfigId || '');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>(processTemplateTemplateName || '');

  // Use projectName as projectId (Azure DevOps accepts both project name and ID)
  const {
    data: configs,
    isLoading: loadingConfigs,
    error: configsError,
  } = useFieldMappingConfigs(projectName || undefined);

  const {
    data: templates,
    isLoading: loadingTemplates,
    error: templatesError,
  } = useFieldMappingTemplates();

  const handleNext = () => {
    if (mappingType === 'project' && selectedConfigId) {
      setFieldMappingConfigId(selectedConfigId);
      setProcessTemplateTemplateName(undefined);
    } else if (mappingType === 'template' && selectedTemplateName) {
      setProcessTemplateTemplateName(selectedTemplateName);
      setFieldMappingConfigId(undefined);
    } else {
      // None selected - clear both
      setFieldMappingConfigId(undefined);
      setProcessTemplateTemplateName(undefined);
    }
    onNext();
  };

  const handleCreateNew = () => {
    navigate('/field-mapping');
  };

  if (!projectName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Field Mapping Selection</CardTitle>
          <CardDescription>
            Select a field mapping configuration to use for this sync
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select or create a project first before selecting field mappings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Mapping Selection</CardTitle>
        <CardDescription>
          Choose a field mapping configuration to map Ardoq fields to Azure DevOps fields for project: <strong>{projectName}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingConfigs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading field mapping configurations...</span>
          </div>
        ) : configsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load field mapping configurations: {configsError.message}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Field Mapping Type</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose to use a process template template (reusable across projects) or a project-specific configuration.
                </p>
                <RadioGroup value={mappingType} onValueChange={(value) => {
                  setMappingType(value as typeof mappingType);
                  if (value !== 'project') setSelectedConfigId('');
                  if (value !== 'template') setSelectedTemplateName('');
                }}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="mapping-none" />
                    <Label htmlFor="mapping-none" className="font-normal cursor-pointer">
                      None (use system defaults)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="mapping-template" />
                    <Label htmlFor="mapping-template" className="font-normal cursor-pointer">
                      Process Template Template (System Default)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="project" id="mapping-project" />
                    <Label htmlFor="mapping-project" className="font-normal cursor-pointer">
                      Project-Specific Configuration
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Process Template Template Selection */}
              {mappingType === 'template' && (
                <div className="space-y-2 pl-6 border-l-2">
                  <Label htmlFor="template-select">Process Template Template</Label>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading templates...</span>
                    </div>
                  ) : templatesError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to load templates: {templatesError.message}
                      </AlertDescription>
                    </Alert>
                  ) : !templates || templates.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No process template templates available.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Select value={selectedTemplateName} onValueChange={setSelectedTemplateName}>
                        <SelectTrigger id="template-select">
                          <SelectValue placeholder="Select a process template template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.processTemplateName}>
                              {template.name}
                              {template.isSystemDefault && <Badge variant="secondary" className="ml-2">System</Badge>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTemplateName && (
                        <div className="p-4 bg-muted rounded-lg">
                          {(() => {
                            const selectedTemplate = templates.find((t) => t.processTemplateName === selectedTemplateName);
                            if (!selectedTemplate) return null;
                            return (
                              <div className="space-y-2">
                                <div className="font-semibold">{selectedTemplate.name}</div>
                                {selectedTemplate.description && (
                                  <div className="text-sm text-muted-foreground">{selectedTemplate.description}</div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                  <strong>{selectedTemplate.mappings.length}</strong> field mapping{selectedTemplate.mappings.length !== 1 ? 's' : ''}
                                </div>
                                <Badge variant="outline">Process Template: {selectedTemplate.processTemplateName}</Badge>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Project-Specific Configuration Selection */}
              {mappingType === 'project' && (
                <div className="space-y-2 pl-6 border-l-2">
                  <Label htmlFor="config-select">Project-Specific Configuration</Label>
                  {!configs || configs.length === 0 ? (
                    <Alert>
                      <Map className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>No project-specific configurations found for this project.</p>
                          <Button variant="outline" size="sm" onClick={handleCreateNew}>
                            <Map className="h-4 w-4 mr-2" />
                            Create Field Mapping Configuration
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                        <SelectTrigger id="config-select">
                          <SelectValue placeholder="Select a project-specific configuration" />
                        </SelectTrigger>
                        <SelectContent>
                          {configs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.name}
                              {config.isDefault && ' (Default)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedConfigId && (
                        <div className="p-4 bg-muted rounded-lg">
                          {(() => {
                            const selectedConfig = configs.find((c) => c.id === selectedConfigId);
                            if (!selectedConfig) return null;
                            return (
                              <div className="space-y-2">
                                <div className="font-semibold">{selectedConfig.name}</div>
                                {selectedConfig.description && (
                                  <div className="text-sm text-muted-foreground">{selectedConfig.description}</div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                  <strong>{selectedConfig.mappings.length}</strong> field mapping{selectedConfig.mappings.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleCreateNew}>
                <Map className="h-4 w-4 mr-2" />
                Manage Field Mappings
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

