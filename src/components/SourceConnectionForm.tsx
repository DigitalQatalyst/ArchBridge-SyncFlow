import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { useToast } from '@/hooks/use-toast';
import {
  useArdoqConfigurations,
  useTestArdoqConnection,
  useActivateArdoqConfiguration,
  useActiveArdoqConfiguration,
} from '@/hooks/useArdoq';

interface SourceConnectionFormProps {
  onNext: () => void;
}

export const SourceConnectionForm = ({ onNext }: SourceConnectionFormProps) => {
  const { sourceType, sourceConfigId, setSourceConfigId, setSourceConnected } = useConnection();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [testing, setTesting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [justActivated, setJustActivated] = useState(false);

  // Track the original active configuration when component loads
  const { data: initialActiveConfig } = useActiveArdoqConfiguration();
  const originalActiveConfigIdRef = useRef<string | undefined>(undefined);

  const { data: configurations, isLoading } = useArdoqConfigurations();
  const testMutation = useTestArdoqConnection();
  const activateMutation = useActivateArdoqConfiguration();

  // Store the original active config ID when component mounts
  useEffect(() => {
    if (initialActiveConfig && !originalActiveConfigIdRef.current) {
      originalActiveConfigIdRef.current = initialActiveConfig.id;
    }
  }, [initialActiveConfig]);

  // Filter only tested and passed configurations
  const testedConfigurations = configurations?.filter(
    (config) => config.isTested && config.testPassed
  ) || [];

  const selectedConfig = configurations?.find((config) => config.id === sourceConfigId);
  const hasMultipleConfigs = testedConfigurations.length > 1;

  const handleTestConnection = async () => {
    if (!sourceConfigId) {
      toast({
        title: 'No Configuration Selected',
        description: 'Please select an Ardoq configuration first.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testMutation.mutateAsync(sourceConfigId);

      if (result.configuration.testPassed) {
        setTestResult('success');
        setSourceConnected(true);
        setJustActivated(false); // Clear activation flag on successful test
        toast({
          title: 'Connection Test Passed',
          description: 'Successfully connected to Ardoq',
        });
      } else {
        // Test failed - revert to original active configuration if we switched
        setTestResult('error');
        setSourceConnected(false);

        // Revert to original active config if we had one and switched away
        if (
          originalActiveConfigIdRef.current &&
          sourceConfigId !== originalActiveConfigIdRef.current
        ) {
          try {
            await activateMutation.mutateAsync(originalActiveConfigIdRef.current);
            setSourceConfigId(originalActiveConfigIdRef.current);
            setJustActivated(false);
            toast({
              title: 'Reverted to Original Configuration',
              description: 'Configuration has been reverted to the previously active one.',
            });
          } catch (revertError) {
            console.error('Failed to revert to original configuration:', revertError);
          }
        }

        toast({
          title: 'Connection Test Failed',
          description: result.configuration.testError || 'Connection test failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTestResult('error');
      setSourceConnected(false);

      // Revert to original active config on error
      if (
        originalActiveConfigIdRef.current &&
        sourceConfigId !== originalActiveConfigIdRef.current
      ) {
        try {
          await activateMutation.mutateAsync(originalActiveConfigIdRef.current);
          setSourceConfigId(originalActiveConfigIdRef.current);
          setJustActivated(false);
          toast({
            title: 'Reverted to Original Configuration',
            description: 'Configuration has been reverted due to test error.',
          });
        } catch (revertError) {
          console.error('Failed to revert to original configuration:', revertError);
        }
      }

      toast({
        title: 'Connection Test Failed',
        description: error instanceof Error ? error.message : 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConfigChange = async (configId: string) => {
    const newConfig = configurations?.find((config) => config.id === configId);

    if (!newConfig) {
      return;
    }

    // Reset test result and connection status
    setTestResult(null);
    setSourceConnected(false);
    setJustActivated(false);
    setSourceConfigId(configId);

    // If there are multiple configs and the selected one is not active, activate it
    if (hasMultipleConfigs && !newConfig.isActive && newConfig.testPassed) {
      setActivating(true);
      setJustActivated(true);
      try {
        await activateMutation.mutateAsync(configId);
        toast({
          title: 'Configuration Activated',
          description: `${newConfig.name} has been activated. Please test the connection before proceeding.`,
        });
      } catch (error) {
        setJustActivated(false);
        toast({
          title: 'Activation Failed',
          description: error instanceof Error ? error.message : 'Failed to activate configuration',
          variant: 'destructive',
        });
        // Revert selection on activation failure
        if (originalActiveConfigIdRef.current) {
          setSourceConfigId(originalActiveConfigIdRef.current);
        }
      } finally {
        setActivating(false);
      }
    } else {
      setJustActivated(false);
    }
  };

  const handleContinue = () => {
    // Require test to pass before continuing, even if config was already tested
    if (testResult === 'success' && sourceConfigId) {
      onNext();
    } else if (sourceConfigId && selectedConfig?.testPassed && selectedConfig?.isTested) {
      // If config is already tested but user hasn't tested in this session, require test
      toast({
        title: 'Test Required',
        description: 'Please test the connection before proceeding.',
        variant: 'destructive',
      });
    }
  };

  const handleConfigure = () => {
    navigate('/configurations/ardoq');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Connect to {sourceType}</h2>
          <p className="text-muted-foreground">
            Select an Ardoq configuration to establish a connection.
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect to {sourceType}</h2>
        <p className="text-muted-foreground">
          Select a tested Ardoq configuration to establish a connection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Configuration</CardTitle>
          <CardDescription>
            Choose from your tested Ardoq configurations. If you select a non-active configuration, it will be activated automatically and you must test the connection before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testedConfigurations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No tested configurations found. Please create and test an Ardoq configuration first.
              </p>
              <Button onClick={handleConfigure}>
                Go to Configurations
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ardoq Configuration *</label>
                <Select
                  value={sourceConfigId || ''}
                  onValueChange={handleConfigChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {testedConfigurations.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{config.name}</span>
                          {config.isActive && (
                            <span className="ml-2 text-xs text-muted-foreground">(Active)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedConfig && (
                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <p>Host: {selectedConfig.apiHost}</p>
                    {selectedConfig.orgLabel && (
                      <p>Organization: {selectedConfig.orgLabel}</p>
                    )}
                  </div>
                )}
              </div>

              {activating && (
                <div className="pt-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating configuration...</span>
                  </div>
                </div>
              )}

              {!activating && (
                <div className="pt-4">
                  <Button
                    onClick={handleTestConnection}
                    disabled={testing || !sourceConfigId || activating}
                    variant="outline"
                    className="w-full"
                  >
                    {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {testing ? 'Testing Connection...' : 'Test Connection'}
                  </Button>
                  {justActivated && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Configuration has been activated. Please test the connection before proceeding.
                    </p>
                  )}
                  {!justActivated && hasMultipleConfigs && selectedConfig && testResult === null && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Please test the connection before proceeding.
                    </p>
                  )}
                </div>
              )}

              {testResult === 'success' && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">Connection successful!</p>
                </div>
              )}

              {testResult === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">Connection failed. Please check your configuration.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleConfigure}>
          <Settings className="w-4 h-4 mr-2" />
          Manage Configurations
        </Button>
        <Button
          onClick={handleContinue}
          disabled={testResult !== 'success' || !sourceConfigId || activating}
          size="lg"
        >
          Continue to Target System
        </Button>
      </div>
    </div>
  );
};
