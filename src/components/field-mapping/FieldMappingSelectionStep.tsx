import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Map, ExternalLink } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { useFieldMappingConfigs } from '@/hooks/useFieldMapping';
import { useNavigate } from 'react-router-dom';

interface FieldMappingSelectionStepProps {
  onNext: () => void;
}

export function FieldMappingSelectionStep({ onNext }: FieldMappingSelectionStepProps) {
  const { projectName, targetConfigId, setFieldMappingConfigId, fieldMappingConfigId } = useConnection();
  const navigate = useNavigate();
  const [selectedConfigId, setSelectedConfigId] = useState<string>(fieldMappingConfigId || '');

  const {
    data: configs,
    isLoading: loadingConfigs,
    error: configsError,
  } = useFieldMappingConfigs(projectName || '');

  const handleNext = () => {
    if (selectedConfigId) {
      setFieldMappingConfigId(selectedConfigId);
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
        ) : !configs || configs.length === 0 ? (
          <Alert>
            <Map className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>No field mapping configurations found for this project.</p>
                <Button variant="outline" size="sm" onClick={handleCreateNew}>
                  <Map className="h-4 w-4 mr-2" />
                  Create Field Mapping Configuration
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config-select">Field Mapping Configuration</Label>
              <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                <SelectTrigger id="config-select">
                  <SelectValue placeholder="Select a field mapping configuration (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (use default mappings)</SelectItem>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                      {config.isDefault && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                If no configuration is selected, default field mappings will be used.
              </p>
            </div>

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

