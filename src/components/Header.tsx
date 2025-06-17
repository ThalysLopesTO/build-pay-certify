
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Crown, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      console.log('🚪 Header logout clicked');
      
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out.",
      });
      
      await logout();
      
      // The logout function will handle the redirect via window.location.reload()
    } catch (error) {
      console.error('Header logout error:', error);
      
      toast({
        title: "Logout failed",
        description: "There was an error signing out. The page will refresh.",
        variant: "destructive",
      });
      
      // Force reload as fallback
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 w-full flex-shrink-0">
      <div className="flex items-center justify-between w-full px-6 py-4">
        <div className="flex items-center space-x-4 min-w-0">
          {/* App Title */}
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-black" />
            <h1 className="text-xl font-semibold text-black whitespace-nowrap">
              Construction Payroll Manager
            </h1>
          </div>
          
          {user?.role === 'super_admin' && (
            <Badge variant="secondary" className="bg-gray-100 text-black border-gray-300">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-4 ml-auto flex-shrink-0">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-sm text-right">
                <div className="font-medium text-black whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-gray-600 whitespace-nowrap">{user.email}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white border-black text-black hover:bg-gray-100 flex-shrink-0"
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
