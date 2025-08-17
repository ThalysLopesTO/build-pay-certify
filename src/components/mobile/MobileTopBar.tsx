import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Menu } from 'lucide-react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import ManagementNotificationBell from '@/components/management/ManagementNotificationBell';
import { toast } from '@/hooks/use-toast';

interface MobileTopBarProps {
  onToggleSidebar?: () => void;
}

const MobileTopBar = ({ onToggleSidebar }: MobileTopBarProps) => {
  const { user, logout } = useAuth();
  const { logoUrl, isLoading } = useCompanyLogo();

  const handleLogout = async () => {
    try {
      console.log('🚪 Mobile logout clicked');
      
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out.",
      });
      
      await logout();
      
      console.log('✅ Mobile logout completed');
      
      // Clear any local state and force navigation
      window.location.href = '/admin-login';
      
    } catch (error) {
      console.error('Mobile logout error:', error);
      
      toast({
        title: "Logout Error", 
        description: "There was an error signing out. Redirecting to login.",
        variant: "destructive",
      });
      
      // Force redirect as fallback
      setTimeout(() => {
        window.location.href = '/admin-login';
      }, 1000);
    }
  };

  return (
    <div className="md:hidden sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between w-full px-3 py-3 max-w-full overflow-hidden">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="h-8 w-8 p-0"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          
          {/* Brand mark - bigger logo for better visibility */}
          {!isLoading && logoUrl && (
            <div className="bg-card border border-border rounded p-1">
              <img
                src={logoUrl}
                alt="Logo"
                className="max-w-[80px] max-h-[40px] w-auto h-auto object-contain"
              />
            </div>
          )}
          {isLoading && (
            <div className="bg-card border border-border rounded p-1">
              <div className="w-20 h-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b border-muted-foreground"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right: Notifications + Logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notification Bell - role-specific */}
          {user?.role === 'management' ? (
            <ManagementNotificationBell />
          ) : (
            <NotificationBell />
          )}
          
          {user && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="h-8 w-8 p-0"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileTopBar;