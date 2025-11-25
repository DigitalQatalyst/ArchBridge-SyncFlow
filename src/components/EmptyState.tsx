import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="mb-6 text-muted-foreground opacity-60">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default" size="lg">
          {action.label}
        </Button>
      )}
    </div>
  );
}

