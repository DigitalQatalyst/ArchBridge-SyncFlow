import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { ArrowBigUp, Settings } from 'lucide-react';

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
    <div className="min-h-screen bg-background flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ArrowBigUp className="w-6 h-6 text-primary rotate-90" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">ArchBridge</h1>
                    <p className="text-sm text-muted-foreground">
                      Enterprise Work Item Synchronization
                    </p>
                  </div>
                </div>
                <Button variant="ghost" asChild>
                  <Link to="/configurations">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurations
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-6 py-8 flex-grow">
            <BreadcrumbNavigation currentStep={currentStep} completedSteps={completedSteps} />

            <div className="mt-8 animate-fade-in">
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
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-card py-6 mt-auto">
            <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
              <p>ArchBridge © 2025 - Extensible Work Item Synchronization Platform</p>
            </div>
          </footer>
        </div>
  );
};

export default Workflow;
