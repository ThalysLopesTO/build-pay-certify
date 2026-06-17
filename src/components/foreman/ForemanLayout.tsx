import React, { Suspense } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import ForemanSidebar from '@/components/foreman/ForemanSidebar';
import LicenseWarningBanner from '@/components/common/LicenseWarningBanner';
import ChatWidget from '@/components/chat/ChatWidget';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const roleDashboards: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  admin: '/admin/dashboard',
  management: '/management/dashboard',
  employee: '/employee/dashboard',
};

const ForemanLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role && user.role !== 'foreman') {
    return <Navigate to={roleDashboards[user.role] ?? '/admin-login'} replace />;
  }

  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
        <ForemanSidebar activeTab={activeTab} setActiveTab={(tab) => navigate(`/foreman/${tab}`)} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 flex flex-col bg-background">
            <div className="flex-1 w-full">
              <div className="w-full p-3 md:p-6">
                <div className="flex items-center gap-2 mb-4 md:mb-6 w-full">
                  <SidebarTrigger className="h-9 w-9 md:h-7 md:w-7 border border-slate-200 md:border-0 rounded-lg text-foreground hover:bg-muted transition-colors" />
                  <span className="text-sm font-medium text-slate-500 md:hidden">Menu</span>
                </div>
                <div className="w-full mb-6">
                  <LicenseWarningBanner />
                </div>
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
          </main>
        </SidebarInset>
      </div>
      <ChatWidget />
    </SidebarProvider>
  );
};

export default ForemanLayout;
