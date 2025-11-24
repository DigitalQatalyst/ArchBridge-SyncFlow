import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { useToast } from '@/hooks/use-toast';

interface TargetConnectionFormProps {
  onNext: () => void;
}

export const TargetConnectionForm = ({ onNext }: TargetConnectionFormProps) => {
  const { targetType, targetCredentials, setTargetCredentials, setTargetConnected } = useConnection();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const [formData, setFormData] = useState({
    organizationUrl: targetCredentials.organizationUrl || '',
    projectName: targetCredentials.projectName || '',
    personalAccessToken: targetCredentials.personalAccessToken || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.organizationUrl.trim()) {
      newErrors.organizationUrl = 'Organization URL is required';
    } else if (!formData.organizationUrl.startsWith('http')) {
      newErrors.organizationUrl = 'Please enter a valid URL';
    }
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project Name is required';
    }
    
    if (!formData.personalAccessToken.trim()) {
      newErrors.personalAccessToken = 'Personal Access Token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate success (90% of the time)
    const success = Math.random() > 0.1;

    if (success) {
      setTestResult('success');
      setTargetCredentials(formData);
      setTargetConnected(true);
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to Azure DevOps project.',
      });
    } else {
      setTestResult('error');
      setTargetConnected(false);
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to Azure DevOps. Please check your credentials.',
        variant: 'destructive',
      });
    }

    setTesting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
    setTestResult(null);
  };

  const handleContinue = () => {
    if (testResult === 'success') {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect to {targetType}</h2>
        <p className="text-muted-foreground">
          Enter your Azure DevOps credentials to establish a connection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            All credentials are stored securely and never shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationUrl">Organization URL *</Label>
            <Input
              id="organizationUrl"
              type="url"
              placeholder="https://dev.azure.com/your-organization"
              value={formData.organizationUrl}
              onChange={(e) => handleInputChange('organizationUrl', e.target.value)}
              className={errors.organizationUrl ? 'border-destructive' : ''}
            />
            {errors.organizationUrl && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.organizationUrl}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              type="text"
              placeholder="Your project name"
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              className={errors.projectName ? 'border-destructive' : ''}
            />
            {errors.projectName && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.projectName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalAccessToken">Personal Access Token *</Label>
            <Input
              id="personalAccessToken"
              type="password"
              placeholder="Enter your Azure DevOps PAT"
              value={formData.personalAccessToken}
              onChange={(e) => handleInputChange('personalAccessToken', e.target.value)}
              className={errors.personalAccessToken ? 'border-destructive' : ''}
            />
            {errors.personalAccessToken && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.personalAccessToken}
              </p>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              variant="outline"
              className="w-full"
            >
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {testing ? 'Testing Connection...' : 'Test Connection'}
            </Button>
          </div>

          {testResult === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-success/10 text-success">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Connection successful!</p>
            </div>
          )}

          {testResult === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Connection failed. Please check your credentials.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={testResult !== 'success'} size="lg">
          Continue to Hierarchy Selection
        </Button>
      </div>
    </div>
  );
};
