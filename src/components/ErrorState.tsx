import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  error?: string | Error | null;
  retry?: {
    label?: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({ 
  icon, 
  title, 
  description, 
  error, 
  retry, 
  className 
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon || (
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      )}
      <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-2">{description}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive/80 max-w-md mb-4 font-mono bg-destructive/10 p-3 rounded">
          {errorMessage}
        </p>
      )}
      {retry && (
        <Button onClick={retry.onClick} variant="outline">
          {retry.label || 'Retry'}
        </Button>
      )}
    </div>
  );
}

