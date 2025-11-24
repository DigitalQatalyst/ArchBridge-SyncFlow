import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface OverwriteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  workItemCount: number;
  onConfirm: () => void;
}

export function OverwriteConfirmationModal({
  open,
  onOpenChange,
  projectName,
  workItemCount,
  onConfirm,
}: OverwriteConfirmationModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmed = confirmationText === projectName;

  const handleConfirm = () => {
    if (isConfirmed) {
      setConfirmationText('');
      // Call onConfirm first - parent will handle closing the modal
      onConfirm();
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirm Overwrite Operation
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete all existing work items in the project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently delete {workItemCount} existing work
              item{workItemCount !== 1 ? 's' : ''} in the project &quot;{projectName}&quot;. This
              action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="confirmation-input" className="text-sm font-medium">
              To confirm, please type the project name: <strong>{projectName}</strong>
            </label>
            <Input
              id="confirmation-input"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={projectName}
              className="font-mono"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed}
          >
            Confirm Overwrite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

