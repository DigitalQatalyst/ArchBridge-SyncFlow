import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BreadcrumbNavigation, WorkflowStep } from '@/components/BreadcrumbNavigation';
import { SourceSelector } from '@/components/SourceSelector';
import { SourceConnectionForm } from '@/components/SourceConnectionForm';
import { TargetSelector } from '@/components/TargetSelector';
import { TargetConnectionForm } from '@/components/TargetConnectionForm';
import { HierarchyViewer } from '@/components/HierarchyViewer';
import { SyncPanel } from '@/components/SyncPanel';
import { ConnectionProvider } from '@/contexts/ConnectionContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { Button } from '@/components/ui/button';
import { ArrowBigUp, Settings } from 'lucide-react';

const Workflow = () => {
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

  return (
    <ConnectionProvider>
      <SyncProvider>
        <div className="min-h-screen bg-background">
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
          <main className="container mx-auto px-6 py-8">
            <BreadcrumbNavigation currentStep={currentStep} completedSteps={completedSteps} />

            <div className="mt-8">
              {currentStep === 'source-select' && (
                <SourceSelector
                  onNext={() => goToNextStep('source-connect')}
                />
              )}
              {currentStep === 'source-connect' && (
                <SourceConnectionForm
                  onNext={() => goToNextStep('target-select')}
                />
              )}
              {currentStep === 'target-select' && (
                <TargetSelector
                  onNext={() => goToNextStep('target-connect')}
                />
              )}
              {currentStep === 'target-connect' && (
                <TargetConnectionForm
                  onNext={() => goToNextStep('hierarchy')}
                />
              )}
              {currentStep === 'hierarchy' && (
                <HierarchyViewer
                  onNext={() => goToNextStep('sync')}
                />
              )}
              {currentStep === 'sync' && <SyncPanel />}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border mt-16 py-6">
            <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
              <p>ArchBridge © 2025 - Extensible Work Item Synchronization Platform</p>
            </div>
          </footer>
        </div>
      </SyncProvider>
    </ConnectionProvider>
  );
};

export default Workflow;
