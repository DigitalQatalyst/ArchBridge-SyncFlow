import { ProjectSelectionStep } from '@/components/azure-devops/ProjectSelectionStep';

interface ProjectCreationStepProps {
  onNext: () => void;
}

export const ProjectCreationStep = ({ onNext }: ProjectCreationStepProps) => {
  return <ProjectSelectionStep onNext={onNext} />;
};

