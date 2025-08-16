import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeProvider';
import { EmployeeProvider } from '@/contexts/EmployeeContext';
import { GlobalToasts } from '@/components/common/GlobalToasts';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';

// Import pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import AdminLogin from '@/pages/AdminLogin';
import EmployeeLogin from '@/pages/EmployeeLogin';
import SubscriptionPlanPage from '@/pages/SubscriptionPlanPage';
import AdminDashboard from '@/pages/AdminDashboard';
import EmployeeDashboard from '@/pages/EmployeeDashboard';
import ForemanDashboard from '@/pages/ForemanDashboard';
import ManagementDashboard from '@/pages/ManagementDashboard';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import SuperAdminLogin from '@/pages/SuperAdminLogin';
import CompanyRegistration from '@/pages/CompanyRegistration';
import CompanyHandbook from '@/pages/CompanyHandbook';
import ResetPassword from '@/pages/ResetPassword';
import LicenseExpired from '@/pages/LicenseExpired';
import InvoicePreview from '@/pages/InvoicePreview';
import NotFound from '@/pages/NotFound';
import MaterialTakeoffPage from '@/pages/admin/MaterialTakeoffPage';
import InventoryIndex from '@/pages/admin/inventory/Index';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

const AppInner: React.FC = () => {
  return (
    <RoleBasedRedirect>
      <Routes>
        <Route path="/" element={<Navigate to="/admin-login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/subscription-plan" element={<SubscriptionPlanPage />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requireSubscription={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/employee/dashboard" element={
          <ProtectedRoute requireSubscription={true}>
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/foreman/dashboard" element={
          <ProtectedRoute requireSubscription={true}>
            <ForemanDashboard />
          </ProtectedRoute>
        } />
        <Route path="/management/dashboard" element={
          <ProtectedRoute requireSubscription={true}>
            <ManagementDashboard />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/company/registration" element={<CompanyRegistration />} />
        <Route path="/company/handbook" element={<CompanyHandbook />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/license-expired" element={<LicenseExpired />} />
        <Route path="/invoice-preview" element={<InvoicePreview />} />
        <Route path="/admin/material-takeoff" element={
          <ProtectedRoute requireSubscription={true}>
            <MaterialTakeoffPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/inventory" element={
          <ProtectedRoute requireSubscription={true}>
            <InventoryIndex />
          </ProtectedRoute>
        } />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </RoleBasedRedirect>
  );
};

const App: React.FC = () => {
  console.log('🚀 App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RealtimeProvider>
            <EmployeeProvider>
              <AppInner />
              <GlobalToasts />
              <Toaster />
              <SonnerToaster />
            </EmployeeProvider>
          </RealtimeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;