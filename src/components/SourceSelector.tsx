import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Check } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { cn } from '@/lib/utils';

interface SourceOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const sourceOptions: SourceOption[] = [
  {
    id: 'ardoq',
    name: 'Ardoq',
    description: 'Enterprise Architecture platform for managing work items and dependencies',
    icon: <Database className="w-8 h-8" />,
  },
  // Future sources can be added here
];

interface SourceSelectorProps {
  onNext: () => void;
}

export const SourceSelector = ({ onNext }: SourceSelectorProps) => {
  const { sourceType, setSourceType } = useConnection();

  const handleSelect = (sourceId: string) => {
    setSourceType(sourceId);
  };

  const handleContinue = () => {
    if (sourceType) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Source System</h2>
        <p className="text-muted-foreground">
          Choose the system where your work items are currently stored.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sourceOptions.map((source) => (
          <Card
            key={source.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary',
              sourceType === source.id && 'border-primary bg-primary/5'
            )}
            onClick={() => handleSelect(source.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {source.icon}
                </div>
                {sourceType === source.id && (
                  <div className="p-1 rounded-full bg-primary text-primary-foreground">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              <CardTitle className="mt-4">{source.name}</CardTitle>
              <CardDescription>{source.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!sourceType} size="lg">
          Continue to Connection
        </Button>
      </div>
    </div>
  );
};
