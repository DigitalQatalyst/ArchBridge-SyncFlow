import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Settings, Workflow as WorkflowIcon } from 'lucide-react';

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

export const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <Link to="/workflow" className="flex items-center gap-3">
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-6 shrink-0">
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
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

