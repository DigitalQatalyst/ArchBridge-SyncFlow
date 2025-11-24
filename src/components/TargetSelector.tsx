import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Check } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { cn } from '@/lib/utils';

interface TargetOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const targetOptions: TargetOption[] = [
  {
    id: 'azure-devops',
    name: 'Azure DevOps',
    description: 'Microsoft Azure DevOps for managing work items, sprints, and backlogs',
    icon: <GitBranch className="w-8 h-8" />,
  },
  // Future targets can be added here
];

interface TargetSelectorProps {
  onNext: () => void;
}

export const TargetSelector = ({ onNext }: TargetSelectorProps) => {
  const { targetType, setTargetType } = useConnection();

  const handleSelect = (targetId: string) => {
    setTargetType(targetId);
  };

  const handleContinue = () => {
    if (targetType) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Target System</h2>
        <p className="text-muted-foreground">
          Choose the system where you want to sync your work items.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targetOptions.map((target) => (
          <Card
            key={target.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary',
              targetType === target.id && 'border-primary bg-primary/5'
            )}
            onClick={() => handleSelect(target.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  {target.icon}
                </div>
                {targetType === target.id && (
                  <div className="p-1 rounded-full bg-primary text-primary-foreground">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              <CardTitle className="mt-4">{target.name}</CardTitle>
              <CardDescription>{target.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!targetType} size="lg">
          Continue to Connection
        </Button>
      </div>
    </div>
  );
};
