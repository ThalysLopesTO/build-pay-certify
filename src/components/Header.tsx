
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LogOut, Crown } from 'lucide-react';
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
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-slate-900">
            Construction Payroll Manager
          </h1>
          {user?.role === 'super_admin' && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-slate-500">{user.email}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
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
