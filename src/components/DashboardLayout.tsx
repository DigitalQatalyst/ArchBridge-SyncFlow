import { useState, ReactNode } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Settings, Workflow as WorkflowIcon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    title: 'Workflow',
    href: '/workflow',
    icon: <WorkflowIcon className="w-5 h-5" />,
  },
  {
    title: 'Configurations',
    href: '/configurations',
    icon: <Settings className="w-5 h-5" />,
  },
];

const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const location = useLocation();

  return (
    <>
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <Link to="/workflow" className="flex items-center gap-3" onClick={onLinkClick}>
          <img
            src="/Archbridge-logo.png"
            alt="ArchBridge Logo"
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">ArchBridge</h1>
            <p className="text-xs text-muted-foreground">
              Work Item Sync
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href === '/configurations' && location.pathname.startsWith('/configurations'));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          © 2025 ArchBridge
        </p>
      </div>
    </>
  );
};

export const DashboardLayout = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Always visible on larger screens */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - Sheet overlay */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 md:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              {location.pathname === '/workflow' && 'Synchronization Workflow'}
              {location.pathname === '/configurations' && 'System Configurations'}
              {location.pathname.startsWith('/configurations/ardoq') && 'Ardoq Configuration'}
              {location.pathname.startsWith('/configurations/azure-devops') && 'Azure DevOps Configuration'}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 md:px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

