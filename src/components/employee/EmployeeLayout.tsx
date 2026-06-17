import React, { Suspense } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import EmployeeBottomNav from '@/components/employee/EmployeeBottomNav';
import EmployeeDesktopNav from '@/components/employee/EmployeeDesktopNav';
import LicenseWarningBanner from '@/components/common/LicenseWarningBanner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ChatWidget from '@/components/chat/ChatWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const roleDashboards: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  admin: '/admin/dashboard',
  foreman: '/foreman/dashboard',
  management: '/management/dashboard',
};

const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (user?.role && user.role !== 'employee') {
    return <Navigate to={roleDashboards[user.role] ?? '/admin-login'} replace />;
  }

  // Second path segment is the active tab slug (/employee/<slug>)
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  const onTabChange = (tab: string) => navigate(`/employee/${tab}`);

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors overflow-x-hidden">
      <ErrorBoundary fallbackMinimal><Header /></ErrorBoundary>
      <ErrorBoundary fallbackMinimal>
        <EmployeeDesktopNav activeTab={activeTab} onTabChange={onTabChange} />
      </ErrorBoundary>
      <div className={`flex-1 ${isMobile ? 'pb-mobile-nav' : 'pb-6'} transition-all duration-300`}>
        <div className="w-full max-w-4xl mx-auto px-3 md:px-4 py-4">
          <LicenseWarningBanner />
          <div className="space-y-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
      {isMobile && (
        <ErrorBoundary fallbackMinimal>
          <EmployeeBottomNav activeTab={activeTab} onTabChange={onTabChange} />
        </ErrorBoundary>
      )}
      <ChatWidget />
    </div>
  );
};

export default EmployeeLayout;
