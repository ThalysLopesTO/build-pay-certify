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
import CompanyRegistration from './pages/CompanyRegistration';

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
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root Route Handler Component
const RootRouteHandler: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-slate-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (user?.role === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRouteHandler />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<CompanyRegistration />} />
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
