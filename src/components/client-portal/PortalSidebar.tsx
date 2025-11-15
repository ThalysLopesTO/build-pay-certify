import { LayoutDashboard, FileText, Receipt, Phone, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function PortalSidebar() {
  const { client, quotes, invoices, company_settings, token } = useClientPortalContext();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: `/client/${token}`,
      exact: true,
    },
    {
      title: 'Quotes',
      icon: FileText,
      path: `/client/${token}/quotes`,
      badge: quotes.length,
    },
    {
      title: 'Invoices',
      icon: Receipt,
      path: `/client/${token}/invoices`,
      badge: invoices.length,
    },
    {
      title: 'Contact',
      icon: Phone,
      path: `/client/${token}/contact`,
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Logo and Company Name */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          {company_settings.company_logo_url ? (
            <img
              src={company_settings.company_logo_url}
              alt={company_settings.company_name}
              className="h-10 w-auto"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {company_settings.company_name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-sm">{company_settings.company_name}</h2>
            <p className="text-xs text-muted-foreground">Client Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all',
                'hover:bg-accent hover:text-accent-foreground',
                active && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant={active ? 'secondary' : 'outline'} className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Client Info */}
      <div className="p-4 border-t">
        <div className="px-4 py-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Logged in as</p>
          <p className="font-semibold text-sm">{client.client_name}</p>
          {client.client_company && (
            <p className="text-xs text-muted-foreground">{client.client_company}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Powered by {company_settings.company_name}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border shadow-lg"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 animate-in slide-in-from-left">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
