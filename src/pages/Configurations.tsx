import { useNavigate, Link } from 'react-router-dom';
import { ConfigurationCard } from '@/components/ConfigurationCard';
import { useActiveArdoqConfiguration } from '@/hooks/useArdoq';
import { Button } from '@/components/ui/button';
import { Settings, ArrowBigUp } from 'lucide-react';

export default function Configurations() {
  const navigate = useNavigate();
  const { data: activeArdoqConfig } = useActiveArdoqConfiguration();

  const handleArdoqClick = () => {
    navigate('/configurations/ardoq');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ArrowBigUp className="w-6 h-6 text-primary rotate-90" />
              </div>
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
          {/* Future system cards can be added here */}
        </div>
      </main>
    </div>
  );
}

