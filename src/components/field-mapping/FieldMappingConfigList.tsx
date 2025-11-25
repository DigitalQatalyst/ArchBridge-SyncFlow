import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit, Trash2, Map, AlertCircle } from 'lucide-react';
import type { FieldMappingConfig } from '@/types/field-mapping';
import { useDeleteFieldMappingConfig } from '@/hooks/useFieldMapping';
import { useState } from 'react';
import { FieldMappingConfigForm } from './FieldMappingConfigForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FieldMappingConfigListProps {
  projectId: string;
  configs?: FieldMappingConfig[];
  isLoading: boolean;
  error: Error | null;
}

export function FieldMappingConfigList({
  projectId,
  configs,
  isLoading,
  error,
}: FieldMappingConfigListProps) {
  const [editingConfig, setEditingConfig] = useState<FieldMappingConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<FieldMappingConfig | null>(null);
  const deleteMutation = useDeleteFieldMappingConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load field mapping configurations: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Field Mapping Configurations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first field mapping configuration to map Ardoq fields to Azure DevOps fields.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = async () => {
    if (deletingConfig) {
      await deleteMutation.mutateAsync({
        configId: deletingConfig.id,
        projectId,
      });
      setDeletingConfig(null);
    }
  };

  if (editingConfig) {
    return (
      <FieldMappingConfigForm
        projectId={projectId}
        projectName={editingConfig.projectName}
        config={editingConfig}
        onSuccess={() => setEditingConfig(null)}
        onCancel={() => setEditingConfig(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <Card key={config.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  {config.isDefault && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
                {config.description && (
                  <CardDescription>{config.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingConfig(config)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingConfig(config)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>{config.mappings.length}</strong> field mapping{config.mappings.length !== 1 ? 's' : ''}
              </div>
              {config.mappings.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Mappings for: {Array.from(new Set(config.mappings.map(m => m.workItemType))).join(', ')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!deletingConfig} onOpenChange={(open) => !open && setDeletingConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field Mapping Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingConfig?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

