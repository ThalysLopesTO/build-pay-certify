import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { User, Settings, LogOut, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
interface UserProfileMenuProps {
  variant?: 'desktop' | 'mobile';
  className?: string;
}
const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  variant = 'desktop',
  className = ''
}) => {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  if (!user) return null;
  const getInitials = () => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      toast({
        title: 'Signing out...',
        description: 'Please wait while we sign you out.',
        duration: 2000
      });
      await Promise.race([logout(), new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 5000))]);
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
        duration: 2000
      });
      window.location.replace('/admin-login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Session ended',
        description: 'You have been signed out.',
        duration: 2000
      });
      window.location.replace('/admin-login');
    } finally {
      setIsLoggingOut(false);
    }
  };
  const handleViewProfile = () => {
    // Navigate to profile based on role
    const profileRoutes: Record<string, string> = {
      super_admin: '/admin/dashboard?tab=profile',
      admin: '/admin/dashboard?tab=profile',
      management: '/management/dashboard?tab=profile',
      foreman: '/foreman/dashboard?tab=profile',
      employee: '/employee/dashboard?tab=profile',
      account: '/account/dashboard?tab=profile'
    };
    const route = user.role ? profileRoutes[user.role] : '/profile';
    navigate(route);
  };
  const handleCompanySettings = () => {
    // Navigate to company settings based on role
    const settingsRoutes: Record<string, string> = {
      super_admin: '/admin/dashboard?tab=company-settings',
      admin: '/admin/dashboard?tab=company-settings',
      management: '/management/dashboard?tab=company-settings',
      foreman: '/foreman/dashboard?tab=company-settings',
      employee: '/employee/dashboard?tab=company-settings',
      account: '/account/dashboard?tab=company-settings'
    };
    const route = user.role ? settingsRoutes[user.role] : '/company-settings';
    navigate(route);
  };
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative h-10 w-10 rounded-full ${className}`} aria-label="User menu">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photo_url} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" sideOffset={12} className="w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50">
        <DropdownMenuLabel className="font-normal p-0">
          <div className="flex items-center gap-4 p-4 bg-white rounded-t-xl border-b border-gray-200">
            <Avatar className="h-14 w-14 ring-2 ring-gray-200">
              <AvatarImage src={user.photo_url} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1.5 min-w-0 flex-1">
              <p className="text-base font-semibold leading-none text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-2" />
        
        <div className="p-3">
          <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 py-3 px-3 rounded-lg transition-colors">
            <User className="mr-3 h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-900">View Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleCompanySettings} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 py-3 px-3 rounded-lg transition-colors">
            <Settings className="mr-3 h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-900">Settings</span>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="my-2" />
        
        <div className="p-3">
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            className="w-full justify-center border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-2"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              'Sign Out'
            )}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>;
};
export default UserProfileMenu;