
import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import ManagementNotificationBell from '@/components/management/ManagementNotificationBell';
import PWAInstallButton from '@/components/common/PWAInstallButton';
import MobileTopBar from '@/components/mobile/MobileTopBar';
import UserProfileMenu from '@/components/common/UserProfileMenu';
import CompanySwitcher from '@/components/common/CompanySwitcher';

const Header = () => {
  const { user } = useAuth();
  const { logoUrl, isLoading } = useCompanyLogo();

  return (
    <>
      {/* Mobile Top Bar */}
      <MobileTopBar />

      {/* Desktop Header — floating rounded card to match the dashboard */}
      <header className="hidden md:block flex-shrink-0 px-3 md:px-6 pt-3 md:pt-5">
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between w-full px-5 py-2.5 gap-4 max-w-full overflow-x-hidden">
            {/* Left: Company Logo */}
            <div className="flex items-center min-w-0 gap-3">
              {!isLoading && logoUrl && (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="h-[52px] w-auto object-contain"
                />
              )}
              {!isLoading && !logoUrl && (
                <div className="w-[160px] h-[52px]" />
              )}
              {isLoading && (
                <div className="flex items-center justify-center w-[160px] h-[52px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-muted-foreground" />
                </div>
              )}
              {user?.role === 'super_admin' && (
                <Badge variant="secondary" className="ml-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              )}
            </div>

            {/* Right: PWA Install, Notifications & User Profile Menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <CompanySwitcher variant="desktop" />
              <PWAInstallButton />

              {user?.role === 'management' ? (
                <ManagementNotificationBell />
              ) : (
                <NotificationBell />
              )}

              {user && <UserProfileMenu variant="desktop" />}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
