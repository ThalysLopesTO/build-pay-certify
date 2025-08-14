import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeProvider';
import { EmployeeProvider } from '@/contexts/EmployeeContext';
import { GlobalToasts } from '@/components/common/GlobalToasts';

// Import pages
import PublicOrRedirect from '@/components/PublicOrRedirect';
import LoginPage from '@/pages/LoginPage';
import EmployeeLoginPage from '@/pages/EmployeeLoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AdminDashboard from '@/pages/AdminDashboard';
import ForemanDashboard from '@/pages/ForemanDashboard';
import ManagementDashboard from '@/pages/ManagementDashboard';
import EmployeeDashboard from '@/pages/EmployeeDashboard';

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
    <Routes>
      {/* Public/Auth Routes */}
      <Route path="/" element={<PublicOrRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/employee-login" element={<EmployeeLoginPage />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/foreman/dashboard" element={<ForemanDashboard />} />
      <Route path="/foreman/*" element={<ForemanDashboard />} />
      <Route path="/management/dashboard" element={<ManagementDashboard />} />
      <Route path="/management/*" element={<ManagementDashboard />} />
      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
      <Route path="/employee/*" element={<EmployeeDashboard />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
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