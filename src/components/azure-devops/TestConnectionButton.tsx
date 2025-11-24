import { Button } from '@/components/ui/button';
import { useTestAzureDevOpsConnection } from '@/hooks/useAzureDevOps';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestConnectionButtonProps {
  configId?: string;
  onTestComplete?: (success: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TestConnectionButton({
  configId,
  onTestComplete,
  variant = 'outline',
  size = 'default',
  className,
}: TestConnectionButtonProps) {
  const { toast } = useToast();
  const testMutation = useTestAzureDevOpsConnection();

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync(configId);
      
      if (result.configuration.testPassed) {
        toast({
          title: 'Connection Test Passed',
          description: 'Successfully connected to Azure DevOps',
        });
        onTestComplete?.(true);
      } else {
        toast({
          title: 'Connection Test Failed',
          description: result.configuration.testError || 'Connection test failed',
          variant: 'destructive',
        });
        onTestComplete?.(false);
      }
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: error instanceof Error ? error.message : 'Failed to test connection',
        variant: 'destructive',
      });
      onTestComplete?.(false);
    }
  };

  const isLoading = testMutation.isPending;

  return (
    <Button
      onClick={handleTest}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Test Connection
        </>
      )}
    </Button>
  );
}

