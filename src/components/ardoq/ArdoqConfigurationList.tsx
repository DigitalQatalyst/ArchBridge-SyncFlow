import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useArdoqConfigurations, useDeleteArdoqConfiguration, useActivateArdoqConfiguration } from '@/hooks/useArdoq';
import { useToast } from '@/hooks/use-toast';
import { TestConnectionButton } from './TestConnectionButton';
import { Edit, Trash2, Power, Loader2 } from 'lucide-react';
import type { ArdoqConfiguration } from '@/types/ardoq';

interface ArdoqConfigurationListProps {
  onEdit: (config: ArdoqConfiguration) => void;
  onCreate: () => void;
}

export function ArdoqConfigurationList({
  onEdit,
  onCreate,
}: ArdoqConfigurationListProps) {
  const { toast } = useToast();
  const { data: configurations, isLoading, error } = useArdoqConfigurations();
  const deleteMutation = useDeleteArdoqConfiguration();
  const activateMutation = useActivateArdoqConfiguration();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<ArdoqConfiguration | null>(null);

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      await deleteMutation.mutateAsync(configToDelete.id);
      toast({
        title: 'Configuration Deleted',
        description: 'Configuration has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete configuration',
        variant: 'destructive',
      });
    }
  };

  const handleActivate = async (config: ArdoqConfiguration) => {
    if (!config.testPassed) {
      toast({
        title: 'Cannot Activate',
        description: 'Configuration must pass the connection test before it can be activated.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await activateMutation.mutateAsync(config.id);
      toast({
        title: 'Configuration Activated',
        description: `${config.name} is now the active configuration.`,
      });
    } catch (error) {
      toast({
        title: 'Activation Failed',
        description: error instanceof Error ? error.message : 'Failed to activate configuration',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load configurations: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!configurations || configurations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          No configurations found. Create your first Ardoq configuration to get started.
        </p>
        <Button onClick={onCreate}>Create Configuration</Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>API Host</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configurations.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-medium">
                  {config.name}
                  {config.isActive && (
                    <Badge variant="default" className="ml-2">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{config.apiHost}</TableCell>
                <TableCell>{config.orgLabel || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {config.isTested ? (
                      config.testPassed ? (
                        <Badge variant="default" className="w-fit">
                          Test Passed
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="w-fit">
                          Test Failed
                        </Badge>
                      )
                    ) : (
                      <Badge variant="secondary" className="w-fit">
                        Not Tested
                      </Badge>
                    )}
                    {config.testError && (
                      <span className="text-xs text-muted-foreground">
                        {config.testError}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TestConnectionButton
                      configId={config.id}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!config.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActivate(config)}
                        disabled={!config.testPassed || activateMutation.isPending}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConfigToDelete(config);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{configToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

