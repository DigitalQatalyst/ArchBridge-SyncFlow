import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurationCardProps {
  name: string;
  description?: string;
  icon?: React.ReactNode;
  isConfigured?: boolean;
  isActive?: boolean;
  activeConfigName?: string;
  onClick: () => void;
  className?: string;
}

export function ConfigurationCard({
  name,
  description,
  icon,
  isConfigured = false,
  isActive = false,
  activeConfigName,
  onClick,
  className,
}: ConfigurationCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-smooth hover:shadow-lg hover:border-primary/50 hover:-translate-y-1',
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon || <Settings className="h-6 w-6 text-primary" />}
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isConfigured ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            {isActive && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isConfigured && activeConfigName && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Active:</span> {activeConfigName}
          </div>
        )}
        {!isConfigured && (
          <div className="text-sm text-muted-foreground">
            Click to configure
          </div>
        )}
      </CardContent>
    </Card>
  );
}

