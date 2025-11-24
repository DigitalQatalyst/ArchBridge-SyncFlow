import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateProjectForm } from '@/components/azure-devops/CreateProjectForm';
import { useConnection } from '@/contexts/ConnectionContext';

interface ProjectCreationStepProps {
  onNext: () => void;
}

export const ProjectCreationStep = ({ onNext }: ProjectCreationStepProps) => {
  const { projectName } = useConnection();

  const handleSuccess = (createdProjectName: string) => {
    // Project creation is queued, allow user to proceed
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Create Azure DevOps Project</h2>
        <p className="text-muted-foreground">
          Create a new project in your Azure DevOps organization. The project name must be unique.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            {projectName
              ? `Project "${projectName}" creation has been queued. You can proceed to the next step.`
              : 'Enter the details for your new Azure DevOps project. The server will validate that the project name does not already exist.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectName ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Project &quot;{projectName}&quot; creation has been queued successfully. You can now proceed to select work items to sync.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={onNext} size="lg">
                  Continue to Hierarchy Selection
                </Button>
              </div>
            </div>
          ) : (
            <CreateProjectForm onSuccess={handleSuccess} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

