import React, { Suspense } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import GlobalCommandPalette from '@/components/admin/GlobalCommandPalette';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const roleDashboards: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  management: '/management/dashboard',
  foreman: '/foreman/dashboard',
  employee: '/employee/dashboard',
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // RoleBasedRedirect only guards "/dashboard" paths; guard all /admin/* here
  if (user?.role && user.role !== 'admin') {
    return <Navigate to={roleDashboards[user.role] ?? '/admin-login'} replace />;
  }

  // First path segment after /admin/ is the active tab slug
  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full overflow-x-hidden">
        <AdminSidebar activeTab={activeTab} setActiveTab={(tab) => navigate(`/admin/${tab}`)} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 overflow-auto min-w-0 bg-background">
            <div className="p-3 md:p-6 w-full max-w-full">
              <div className="flex items-center mb-6 w-full">
                <SidebarTrigger className="mr-4 text-foreground hover:bg-muted transition-colors" />
              </div>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </div>
          </main>
        </SidebarInset>
      </div>
      <GlobalCommandPalette />
    </SidebarProvider>
  );
};

export default AdminLayout;
