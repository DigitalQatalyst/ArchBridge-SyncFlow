import { useState } from 'react';
import { BreadcrumbNavigation, WorkflowStep } from '@/components/BreadcrumbNavigation';
import { SourceSelector } from '@/components/SourceSelector';
import { SourceConnectionForm } from '@/components/SourceConnectionForm';
import { TargetSelector } from '@/components/TargetSelector';
import { TargetConnectionForm } from '@/components/TargetConnectionForm';
import { ProjectCreationStep } from '@/components/ProjectCreationStep';
import { HierarchyViewer } from '@/components/HierarchyViewer';
import { SyncPanel } from '@/components/SyncPanel';
import { ConnectionProvider, useConnection } from '@/contexts/ConnectionContext';
import { SyncProvider } from '@/contexts/SyncContext';

const Workflow = () => {
  return (
    <ConnectionProvider>
      <SyncProvider>
        <WorkflowContent />
      </SyncProvider>
    </ConnectionProvider>
  );
};

const WorkflowContent = () => {
  const { targetType } = useConnection();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('source-select');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);

  const markStepComplete = (step: WorkflowStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const goToNextStep = (nextStep: WorkflowStep) => {
    markStepComplete(currentStep);
    setCurrentStep(nextStep);
  };

  const getNextStepAfterTargetConnect = (): WorkflowStep => {
    // If target is Azure DevOps, go to project creation, otherwise go to hierarchy
    return targetType === 'azure-devops' ? 'project-create' : 'hierarchy';
  };

  return (
    <div className="space-y-8">
      <BreadcrumbNavigation currentStep={currentStep} completedSteps={completedSteps} />

      <div className="animate-fade-in">
        {currentStep === 'source-select' && (
          <div className="animate-slide-up">
            <SourceSelector
              onNext={() => goToNextStep('source-connect')}
            />
          </div>
        )}
        {currentStep === 'source-connect' && (
          <div className="animate-slide-up">
            <SourceConnectionForm
              onNext={() => goToNextStep('target-select')}
            />
          </div>
        )}
        {currentStep === 'target-select' && (
          <div className="animate-slide-up">
            <TargetSelector
              onNext={() => goToNextStep('target-connect')}
            />
          </div>
        )}
        {currentStep === 'target-connect' && (
          <div className="animate-slide-up">
            <TargetConnectionForm
              onNext={() => goToNextStep(getNextStepAfterTargetConnect())}
            />
          </div>
        )}
        {currentStep === 'project-create' && (
          <div className="animate-slide-up">
            <ProjectCreationStep
              onNext={() => goToNextStep('hierarchy')}
            />
          </div>
        )}
        {currentStep === 'hierarchy' && (
          <div className="animate-slide-up">
            <HierarchyViewer
              onNext={() => goToNextStep('sync')}
            />
          </div>
        )}
        {currentStep === 'sync' && (
          <div className="animate-slide-up">
            <SyncPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflow;
