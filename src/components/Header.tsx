
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import ManagementNotificationBell from '@/components/management/ManagementNotificationBell';
import PWAInstallButton from '@/components/common/PWAInstallButton';
import MobileTopBar from '@/components/mobile/MobileTopBar';
import UserProfileMenu from '@/components/common/UserProfileMenu';

const Header = () => {
  const { user } = useAuth();
  const { logoUrl, isLoading } = useCompanyLogo();

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
          
          {/* Right: PWA Install, Notifications & User Profile Menu */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* PWA Install Button */}
            <PWAInstallButton />
            
            {/* Notification Bell - role-specific */}
            {user?.role === 'management' ? (
              <ManagementNotificationBell />
            ) : (
              <NotificationBell />
            )}
            
            {/* User Profile Menu */}
            {user && <UserProfileMenu variant="desktop" />}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
