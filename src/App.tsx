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
import HomePage from '@/pages/HomePage';
import AdminDashboard from '@/pages/AdminDashboard';

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
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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