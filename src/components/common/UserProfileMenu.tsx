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
  const handleSettings = () => {
    // Navigate to settings based on role
    const settingsRoutes: Record<string, string> = {
      super_admin: '/admin/dashboard?tab=settings',
      admin: '/admin/dashboard?tab=settings',
      management: '/management/dashboard?tab=settings',
      foreman: '/foreman/dashboard?tab=settings',
      employee: '/employee/dashboard?tab=settings',
      account: '/account/dashboard?tab=settings'
    };
    const route = user.role ? settingsRoutes[user.role] : '/settings';
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
      
      <DropdownMenuContent align="end" sideOffset={12} className="w-72 border border-border rounded-xl shadow-xl z-50 bg-slate-100">
        <DropdownMenuLabel className="font-normal p-0">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-t-xl border-b border-border/50">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
              <AvatarImage src={user.photo_url} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1.5 min-w-0 flex-1">
              <p className="text-base font-semibold leading-none text-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1" />
        
        <div className="p-2">
          <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer hover:bg-accent/80 focus:bg-accent/80 py-3 px-3 rounded-lg transition-colors">
            <User className="mr-3 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">View Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSettings} className="cursor-pointer hover:bg-accent/80 focus:bg-accent/80 py-3 px-3 rounded-lg transition-colors">
            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Settings</span>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="my-1" />
        
        <div className="p-2">
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive focus:text-destructive py-3 px-3 rounded-lg transition-colors font-medium">
            {isLoggingOut ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <LogOut className="mr-3 h-4 w-4" />}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>;
};
export default UserProfileMenu;