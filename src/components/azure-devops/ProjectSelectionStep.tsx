import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { CreateProjectForm } from './CreateProjectForm';
import { OverwriteConfirmationModal } from './OverwriteConfirmationModal';
import { useConnection } from '@/contexts/ConnectionContext';
import { useListAzureDevOpsProjects, useCheckWorkItems } from '@/hooks/useAzureDevOps';
import { useToast } from '@/hooks/use-toast';

interface ProjectSelectionStepProps {
  onNext: () => void;
}

export function ProjectSelectionStep({ onNext }: ProjectSelectionStepProps) {
  const { toast } = useToast();
  const {
    targetConfigId,
    projectName,
    setProjectName,
    overwriteMode,
    setOverwriteMode,
  } = useConnection();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const isConfirmingRef = useRef(false);

  const { data: projects, isLoading: loadingProjects, error: projectsError } =
    useListAzureDevOpsProjects(targetConfigId);

  const selectedProject = projects?.find((p) => p.id === selectedProjectId || p.name === selectedProjectId);

  const {
    data: workItemsCheck,
    isLoading: checkingWorkItems,
    error: workItemsError,
  } = useCheckWorkItems(selectedProject?.name, targetConfigId);

  // Reset overwrite mode when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setOverwriteMode(undefined);
      setShowOverwriteWarning(false);
      setOverwriteConfirmed(false);
    }
  }, [selectedProjectId, setOverwriteMode]);

  // When overwrite radio is selected, show warning and open modal (only if not already confirmed)
  useEffect(() => {
    if (overwriteMode === true && workItemsCheck?.hasWorkItems && !overwriteConfirmed) {
      setShowOverwriteWarning(true);
      if (!showOverwriteModal) {
        setShowOverwriteModal(true);
      }
    } else if (overwriteMode === false) {
      setShowOverwriteWarning(false);
      setShowOverwriteModal(false);
      setOverwriteConfirmed(false);
    } else if (overwriteMode === true && overwriteConfirmed) {
      // Keep warning visible after confirmation
      setShowOverwriteWarning(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overwriteMode, workItemsCheck?.hasWorkItems, overwriteConfirmed]);

  const handleProjectSelect = (projectIdOrName: string) => {
    setSelectedProjectId(projectIdOrName);
    setProjectName(projectIdOrName);
    setOverwriteMode(undefined);
    setShowOverwriteWarning(false);
  };

  const handleCreateSuccess = (createdProjectName: string) => {
    setProjectName(createdProjectName);
    setOverwriteMode(false); // New projects don't have work items, so no overwrite needed
  };

  const handleOverwriteConfirm = () => {
    // Mark that we're confirming to prevent cancel handler
    isConfirmingRef.current = true;
    // Mark as confirmed
    setOverwriteConfirmed(true);
    // Keep overwriteMode as true so the radio button stays selected
    setOverwriteMode(true);
    setShowOverwriteWarning(true);
    // Close the modal
    setShowOverwriteModal(false);
    toast({
      title: 'Overwrite Mode Enabled',
      description: 'Existing work items will be deleted before syncing new items.',
      variant: 'default',
    });
    // Reset the ref after a short delay
    setTimeout(() => {
      isConfirmingRef.current = false;
    }, 100);
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteModal(false);
    setOverwriteMode(undefined);
    setShowOverwriteWarning(false);
    setOverwriteConfirmed(false);
  };

  const handleContinue = () => {
    if (!projectName) {
      toast({
        title: 'Project Required',
        description: 'Please create or select a project before continuing.',
        variant: 'destructive',
      });
      return;
    }

    // If work items exist and no mode selected, show error
    if (workItemsCheck?.hasWorkItems && overwriteMode === undefined) {
      toast({
        title: 'Action Required',
        description: 'Please choose whether to add to or overwrite existing work items.',
        variant: 'destructive',
      });
      return;
    }

    onNext();
  };

  const canContinue =
    projectName &&
    (!workItemsCheck?.hasWorkItems || overwriteMode !== undefined);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Azure DevOps Project
        </h2>
        <p className="text-muted-foreground">
          Create a new project or select an existing one to populate with data from Ardoq.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Selection</CardTitle>
          <CardDescription>
            {projectName
              ? `Project "${projectName}" is selected. You can proceed to the next step.`
              : 'Choose to create a new project or select an existing one.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectName && !selectedProjectId ? (
            // Project was created (not selected from list)
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Project &quot;{projectName}&quot; creation has been queued successfully. You can
                  now proceed to select work items to sync.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={onNext} size="lg">
                  Continue to Hierarchy Selection
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create New Project</TabsTrigger>
                <TabsTrigger value="select">Select Existing Project</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-6">
                <CreateProjectForm onSuccess={handleCreateSuccess} />
              </TabsContent>

              <TabsContent value="select" className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="project-select">Select Project</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={handleProjectSelect}
                    disabled={loadingProjects || !targetConfigId}
                  >
                    <SelectTrigger id="project-select">
                      <SelectValue
                        placeholder={
                          loadingProjects
                            ? 'Loading projects...'
                            : !targetConfigId
                            ? 'Please configure Azure DevOps connection first'
                            : 'Select a project'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.name}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {projectsError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to load projects:{' '}
                        {projectsError instanceof Error
                          ? projectsError.message
                          : 'Unknown error'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {selectedProject && (
                  <div className="space-y-4">
                    {checkingWorkItems ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Checking for existing work items...</span>
                      </div>
                    ) : workItemsError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to check work items:{' '}
                          {workItemsError instanceof Error
                            ? workItemsError.message
                            : 'Unknown error'}
                        </AlertDescription>
                      </Alert>
                    ) : workItemsCheck ? (
                      <div className="space-y-4">
                        {workItemsCheck.hasWorkItems ? (
                          <>
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                This project contains {workItemsCheck.count} existing work
                                item{workItemsCheck.count !== 1 ? 's' : ''}. Choose how to proceed:
                              </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                              <Label>How would you like to proceed?</Label>
                              <RadioGroup
                                value={
                                  overwriteMode === undefined
                                    ? ''
                                    : overwriteMode
                                    ? 'overwrite'
                                    : 'add'
                                }
                                onValueChange={(value) => {
                                  if (value === 'overwrite') {
                                    setOverwriteMode(true);
                                    setOverwriteConfirmed(false); // Reset confirmation when user changes selection
                                  } else if (value === 'add') {
                                    setOverwriteMode(false);
                                    setShowOverwriteWarning(false);
                                    setOverwriteConfirmed(false);
                                    setShowOverwriteModal(false); // Close modal if it was open
                                  }
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="add" id="add" />
                                  <Label
                                    htmlFor="add"
                                    className="font-normal cursor-pointer flex-1"
                                  >
                                    Add to existing work items
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="overwrite" id="overwrite" />
                                  <Label
                                    htmlFor="overwrite"
                                    className="font-normal cursor-pointer flex-1"
                                  >
                                    Overwrite existing work items (delete all and create new)
                                  </Label>
                                </div>
                              </RadioGroup>

                              {showOverwriteWarning && (
                                <Alert variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>Warning:</strong> Overwriting will permanently delete
                                    all {workItemsCheck.count} existing work item
                                    {workItemsCheck.count !== 1 ? 's' : ''} in this project. This
                                    action cannot be undone.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              This project has no existing work items. New items will be created.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {selectedProject && canContinue && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleContinue} size="lg">
                      Continue to Hierarchy Selection
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {selectedProject && workItemsCheck?.hasWorkItems && (
        <OverwriteConfirmationModal
          open={showOverwriteModal}
          onOpenChange={(open) => {
            // Only cancel if user closes without confirming (e.g., clicking outside or X button)
            // Use ref to check if we're in the middle of confirming
            if (!open && !isConfirmingRef.current) {
              handleOverwriteCancel();
            }
          }}
          projectName={selectedProject.name}
          workItemCount={workItemsCheck.count}
          onConfirm={handleOverwriteConfirm}
        />
      )}
    </div>
  );
}

