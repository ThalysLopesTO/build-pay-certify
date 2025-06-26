
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth, AuthProvider } from '@/contexts/SupabaseAuthContext';
import LoginForm from './components/LoginForm';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ForemanDashboard from './pages/ForemanDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PayrollDashboard from './pages/PayrollDashboard';
import SubscriptionLanding from './components/SubscriptionLanding';
import PricingPage from './pages/PricingPage';

const queryClient = new QueryClient();

// Subscription Gate Component
const SubscriptionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'foreman' | 'payroll' | 'employee';
}> = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Super Admin User Checker Component
const SuperAdminUserChecker: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'super_admin') {
      window.location.href = '/super-admin';
    } else if (user) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  return <div>Redirecting...</div>;
};

import { useEffect } from 'react';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SuperAdminUserChecker />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/subscription" element={<SubscriptionLanding />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <SubscriptionGate>
                      <EmployeeDashboard />
                    </SubscriptionGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/foreman"
                element={
                  <ProtectedRoute requiredRole="foreman">
                    <SubscriptionGate>
                      <ForemanDashboard />
                    </SubscriptionGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute requiredRole="super_admin">
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll"
                element={
                  <ProtectedRoute requiredRole="payroll">
                    <SubscriptionGate>
                      <PayrollDashboard />
                    </SubscriptionGate>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
