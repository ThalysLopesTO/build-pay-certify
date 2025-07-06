
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Header = () => {
  const { user, logout } = useAuth();
  const { logoUrl, isLoading } = useCompanyLogo();

  const handleLogout = async () => {
    try {
      console.log('🚪 Header logout clicked');
      
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out.",
      });
      
      await logout();
      
    } catch (error) {
      console.error('Header logout error:', error);
      
      toast({
        title: "Logout Error",
        description: "There was an error signing out. Redirecting to login.",
        variant: "destructive",
      });
      
      // Force redirect as fallback
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  };

  return (
    <header className="bg-background border-b border-border w-full flex-shrink-0 transition-colors duration-300">
      <div className="flex items-center justify-between w-full px-6 py-4">
        {/* Left: Company Logo */}
        <div className="flex items-center">
          {!isLoading && logoUrl && (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4">
              <img
                src={logoUrl}
                alt="Company Logo"
                className="max-w-[400px] max-h-[70px] w-auto h-auto object-contain"
                style={{ maxWidth: '400px', maxHeight: '70px' }}
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
        
        {/* Right: Theme Toggle, Notifications & User Profile & Logout */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notification Bell - only for admins and foremen */}
          <NotificationBell />
          
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-sm text-right">
                <div className="font-medium text-foreground whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-muted-foreground whitespace-nowrap">{user.email}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2 flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
