import { useNavigate, Link } from 'react-router-dom';
import { ConfigurationCard } from '@/components/ConfigurationCard';
import { useActiveArdoqConfiguration } from '@/hooks/useArdoq';
import { useActiveAzureDevOpsConfiguration } from '@/hooks/useAzureDevOps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Configurations() {
  const navigate = useNavigate();
  const { data: activeArdoqConfig, isLoading: loadingArdoq } = useActiveArdoqConfiguration();
  const { data: activeAzureDevOpsConfig, isLoading: loadingAzure } = useActiveAzureDevOpsConfiguration();

  const handleArdoqClick = () => {
    navigate('/configurations/ardoq');
  };

  const handleAzureDevOpsClick = () => {
    navigate('/configurations/azure-devops');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Archbridge-logo.png"
                alt="ArchBridge Logo"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">System Configurations</h1>
                <p className="text-sm text-muted-foreground">
                  Configure and manage connections to external systems
                </p>
              </div>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/workflow">
                Workflow
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {(loadingArdoq || loadingAzure) ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ConfigurationCard
              name="Ardoq"
              description="Enterprise Architecture Management Platform"
              icon={<Settings className="h-6 w-6 text-primary" />}
              isConfigured={!!activeArdoqConfig}
              isActive={activeArdoqConfig?.isActive || false}
              activeConfigName={activeArdoqConfig?.name}
              onClick={handleArdoqClick}
            />
            <ConfigurationCard
              name="Azure DevOps"
              description="Azure DevOps Services and Team Foundation Server"
              icon={<Settings className="h-6 w-6 text-primary" />}
              isConfigured={!!activeAzureDevOpsConfig}
              isActive={activeAzureDevOpsConfig?.isActive || false}
              activeConfigName={activeAzureDevOpsConfig?.name}
              onClick={handleAzureDevOpsClick}
            />
            {/* Future system cards can be added here */}
          </div>
        )}
      </main>
    </div>
  );
}

