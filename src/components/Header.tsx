
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

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
        {/* Left: Company Logo */}
        <div className="flex items-center">
          {!isLoading && logoUrl && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
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
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-center w-[200px] h-[50px]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
              </div>
            </div>
          )}
          {user?.role === 'super_admin' && (
            <Badge variant="secondary" className="bg-gray-100 text-black border-gray-300 ml-3">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          )}
        </div>
        
        {/* Right: User Profile & Logout */}
        <div className="flex items-center space-x-4">
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
