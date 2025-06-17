
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Crown, Building } from 'lucide-react';
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
    <header className="header-modern px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Company Logo Container */}
          <div className="flex items-center">
            {!isLoading && logoUrl ? (
              <div className="card-modern p-3 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="max-w-[400px] max-h-[70px] w-auto h-auto object-contain"
                  style={{ maxWidth: '400px', maxHeight: '70px' }}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-black" />
                <h1 className="text-xl font-bold text-black">
                  Construction Payroll Manager
                </h1>
              </div>
            )}
          </div>
          
          {user?.role === 'super_admin' && (
            <Badge variant="secondary" className="bg-gray-100 text-black border-gray-300">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-semibold text-black">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-gray-600">{user.email}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="btn-secondary-modern flex items-center space-x-2"
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
