import React, { Suspense } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import ManagementSidebar from '@/components/management/ManagementSidebar';
import LicenseWarningBanner from '@/components/common/LicenseWarningBanner';
import ChatWidget from '@/components/chat/ChatWidget';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const roleDashboards: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  admin: '/admin/dashboard',
  foreman: '/foreman/dashboard',
  employee: '/employee/dashboard',
};

const ManagementLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role && user.role !== 'management') {
    return <Navigate to={roleDashboards[user.role] ?? '/admin-login'} replace />;
  }

  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
        <ManagementSidebar activeTab={activeTab} setActiveTab={(tab) => navigate(`/management/${tab}`)} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 flex flex-col bg-background">
            <div className="flex-1 w-full">
              <div className="w-full p-3 md:p-6">
                <div className="flex items-center mb-6 w-full">
                  <SidebarTrigger className="mr-4 text-foreground hover:bg-muted transition-colors" />
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

export default ManagementLayout;
