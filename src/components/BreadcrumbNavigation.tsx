import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnection } from '@/contexts/ConnectionContext';

export type WorkflowStep = 
  | 'source-select'
  | 'source-connect'
  | 'target-select'
  | 'target-connect'
  | 'project-create'
  | 'field-mapping'
  | 'hierarchy'
  | 'sync';

interface BreadcrumbNavigationProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
}

const allSteps: { id: WorkflowStep; label: string }[] = [
  { id: 'source-select', label: 'Source System' },
  { id: 'source-connect', label: 'Source Connection' },
  { id: 'target-select', label: 'Target System' },
  { id: 'target-connect', label: 'Target Connection' },
  { id: 'project-create', label: 'Create Project' },
  { id: 'field-mapping', label: 'Field Mapping' },
  { id: 'hierarchy', label: 'Select Items' },
  { id: 'sync', label: 'Sync' },
];

export const BreadcrumbNavigation = ({ currentStep, completedSteps }: BreadcrumbNavigationProps) => {
  const { targetType } = useConnection();
  
  // Only show project-create step if target is Azure DevOps, but skip field-mapping
  const steps = targetType === 'azure-devops'
    ? allSteps.filter((step) => step.id !== 'field-mapping')
    : allSteps.filter((step) => step.id !== 'project-create' && step.id !== 'field-mapping');
  
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isUpcoming = index > currentIndex;

          return (
            <li key={step.id} className="flex items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted && 'bg-success border-success text-success-foreground',
                    isCurrent && 'bg-primary border-primary text-primary-foreground',
                    isUpcoming && 'bg-background border-border text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isCompleted && 'text-success',
                      isCurrent && 'text-primary',
                      isUpcoming && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted ? 'bg-success' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
