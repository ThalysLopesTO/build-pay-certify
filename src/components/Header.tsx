
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Crown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/notifications/NotificationBell';
import ManagementNotificationBell from '@/components/management/ManagementNotificationBell';
import PWAInstallButton from '@/components/common/PWAInstallButton';
import MobileTopBar from '@/components/mobile/MobileTopBar';

const Header = () => {
  const { user, logout } = useAuth();
  const { logoUrl, isLoading } = useCompanyLogo();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('🚪 Header logout clicked');
      
      // Immediate feedback
      const toastId = toast({
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
      
      console.log('✅ Header logout completed, navigating to login...');
      
      // Navigate with fallback
      setTimeout(() => {
        try {
          navigate('/admin-login', { replace: true });
        } catch {
          window.location.replace('/admin-login');
        }
      }, 100);
      
    } catch (error) {
      console.error('Header logout error:', error);
      
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
    <>
      {/* Mobile Top Bar */}
      <MobileTopBar />
      
      {/* Desktop Header - hidden on mobile */}
      <header className="hidden md:flex bg-background border-b border-border w-full flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center justify-between w-full px-6 py-4 max-w-full overflow-x-hidden">
          {/* Left: Company Logo */}
          <div className="flex items-center min-w-0">
            {!isLoading && logoUrl && (
              <div className="">
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="h-[60px] w-auto object-contain"
                />
              </div>
            )}
            {!isLoading && !logoUrl && (
              <div className="w-[200px] h-[70px]">
                {/* Blank space when no logo is uploaded */}
              </div>
            )}
            {isLoading && (
              <div className="bg-card border border-border rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-center w-[200px] h-[50px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-muted-foreground"></div>
                </div>
              </div>
            )}
            {user?.role === 'super_admin' && (
              <Badge variant="secondary" className="ml-3">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
          
          {/* Right: PWA Install, Notifications & User Profile & Logout */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* PWA Install Button */}
            <PWAInstallButton />
            
            {/* Notification Bell - role-specific */}
            {user?.role === 'management' ? (
              <ManagementNotificationBell />
            ) : (
              <NotificationBell />
            )}
            
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-right min-w-0">
                  <div className="font-medium text-foreground whitespace-nowrap">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap">{user.email}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-2 flex-shrink-0"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
