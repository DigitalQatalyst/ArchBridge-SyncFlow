import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AzureDevOpsConfigurationList } from '@/components/azure-devops/AzureDevOpsConfigurationList';
import { AzureDevOpsConfigurationForm } from '@/components/azure-devops/AzureDevOpsConfigurationForm';
import { ArrowLeft, Plus } from 'lucide-react';
import type { AzureDevOpsConfiguration } from '@/types/azure-devops';

export default function AzureDevOpsConfiguration() {
  const navigate = useNavigate();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AzureDevOpsConfiguration | undefined>();

  const handleCreate = () => {
    setEditingConfig(undefined);
    setFormDialogOpen(true);
  };

  const handleEdit = (config: AzureDevOpsConfiguration) => {
    setEditingConfig(config);
    setFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingConfig(undefined);
  };

  const handleFormCancel = () => {
    setFormDialogOpen(false);
    setEditingConfig(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/configurations')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Azure DevOps Configuration</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your Azure DevOps API configurations
                </p>
              </div>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/workflow">
                Workflow
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Configurations</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage Azure DevOps API configurations. Only tested configurations can be used.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Configuration
          </Button>
        </div>

        <AzureDevOpsConfigurationList onEdit={handleEdit} onCreate={handleCreate} />

        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
              </DialogTitle>
              <DialogDescription>
                {editingConfig
                  ? 'Update your Azure DevOps configuration settings.'
                  : 'Create a new Azure DevOps configuration. The connection will be tested automatically.'}
              </DialogDescription>
            </DialogHeader>
            <AzureDevOpsConfigurationForm
              configuration={editingConfig}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

