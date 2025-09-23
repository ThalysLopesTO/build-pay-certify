import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Menu, Loader2 } from 'lucide-react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import ManagementNotificationBell from '@/components/management/ManagementNotificationBell';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface MobileTopBarProps {
  onToggleSidebar?: () => void;
}

const MobileTopBar = ({ onToggleSidebar }: MobileTopBarProps) => {
  const { user, logout } = useAuth();
  const { logoUrl, isLoading } = useCompanyLogo();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('🚪 Mobile logout clicked');
      
      // Immediate feedback
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out.",
        duration: 2000,
      });
      
      // Clear local state immediately for better UX
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Call logout with timeout
      const logoutPromise = logout();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      
      console.log('✅ Mobile logout completed');
      
      // Navigate with fallback
      setTimeout(() => {
        try {
          navigate('/admin-login', { replace: true });
        } catch {
          window.location.replace('/admin-login');
        }
      }, 100);
      
    } catch (error) {
      console.error('Mobile logout error:', error);
      
      toast({
        title: "Signed out", 
        description: "You have been signed out successfully.",
        duration: 2000,
      });
      
      // Always navigate even on error
      setTimeout(() => {
        try {
          navigate('/admin-login', { replace: true });
        } catch {
          window.location.replace('/admin-login');
        }
      }, 100);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div 
      className="md:hidden sticky top-0 z-50 bg-background border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
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
                className="max-w-[120px] max-h-[100px] w-auto h-auto object-contain"
              />
            </div>
          )}
          {isLoading && (
            <div className="bg-card border border-border rounded p-1">
              <div className="w-30 h-25 flex items-center justify-center">
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
              disabled={isLoggingOut}
              className="h-8 w-8 p-0"
              aria-label={isLoggingOut ? "Signing out..." : "Logout"}
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileTopBar;