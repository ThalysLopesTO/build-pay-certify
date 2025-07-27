
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/SupabaseAuthContext";

import { toast } from '@/hooks/use-toast';
import HomePage from "./pages/HomePage";
import LoginForm from "./components/LoginForm";
import EmployeeLoginForm from "./components/EmployeeLoginForm";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import CompanyRegistration from "./pages/CompanyRegistration";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForemanDashboard from "./pages/ForemanDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import LicenseExpired from "./pages/LicenseExpired";
import NotFound from "./pages/NotFound";
import InvoicePreview from "./pages/InvoicePreview";
import LicenseGuard from "./components/common/LicenseGuard";
import SubscriptionGate from "./components/SubscriptionGate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const CompanyErrorFallback = ({ error, onLogout }: { error: string; onLogout: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <div className="max-w-md w-full">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span className="font-semibold">Company Access Required</span>
            </div>
            <p className="text-sm">{error}</p>
            <div className="pt-2">
              <Button onClick={onLogout} variant="outline" size="sm" className="w-full">
                Sign Out and Try Again
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const DashboardRouter = () => {
  const { user, loading, companyError, logout } = useAuth();
  
  console.log('📊 DashboardRouter state:', { user: user?.email, loading, companyError, role: user?.role });
  
  if (loading) {
    console.log('⏳ Dashboard loading...');
    return <LoadingScreen />;
  }

  if (companyError) {
    console.log('🚨 Company error in dashboard:', companyError);
    return <CompanyErrorFallback error={companyError} onLogout={logout} />;
  }
  
  if (!user) {
    console.log('🔒 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ Routing user to dashboard based on role:', user.role);
  
  // Route based on user role with subscription and license protection
  const DashboardComponent = () => {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return <AdminDashboard />;
    } else if (user.role === 'management') {
      return <ManagementDashboard />;
    } else if (user.role === 'foreman') {
      return <ForemanDashboard />;
    } else {
      return <EmployeeDashboard />;
    }
  };

  return (
    <SubscriptionGate>
      <LicenseGuard>
        <DashboardComponent />
      </LicenseGuard>
    </SubscriptionGate>
  );
};

const EmployeeDashboardRouter = () => {
  const { user, loading, companyError, logout } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  if (companyError) {
    return <CompanyErrorFallback error={companyError} onLogout={logout} />;
  }
  
  if (!user) {
    return <Navigate to="/employee-login" replace />;
  }
  
  // Only allow employees to access this route
  if (user.role !== 'employee') {
    toast({
      title: "Access Denied",
      description: "This dashboard is for employees only. Please use the appropriate login page.",
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }

  return (
    <SubscriptionGate>
      <LicenseGuard>
        <EmployeeDashboard />
      </LicenseGuard>
    </SubscriptionGate>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, loading, companyError, logout, user } = useAuth();

  console.log('🏠 AppRoutes render:', { isAuthenticated, loading, companyError });

  if (loading) {
    console.log('⏳ App loading...');
    return <LoadingScreen />;
  }

  if (companyError && !isAuthenticated) {
    console.log('🚨 Company error in app:', companyError);
    return <CompanyErrorFallback error={companyError} onLogout={logout} />;
  }

  console.log('🎯 Rendering main app routes');

  return (
    <BrowserRouter>
      <Routes>
        {/* Home page - shows subscription landing for non-authenticated users */}
        <Route 
          path="/" 
          element={
            !isAuthenticated ? (
              <HomePage />
            ) : (
              <DashboardRouter />
            )
          } 
        />
        
        {/* Admin routes - protected by authentication */}
        <Route 
          path="/admin/*" 
          element={
            isAuthenticated ? (
              <Routes>
                <Route path="attention-reports/:reportId" element={<DashboardRouter />} />
                <Route path="*" element={<DashboardRouter />} />
              </Routes>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Invoice Preview Route - Admin Only */}
        <Route 
          path="/invoices/:invoiceId/preview" 
          element={
            isAuthenticated ? (
              <InvoicePreview />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginForm /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/employee-login" 
          element={!isAuthenticated ? <EmployeeLoginForm /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/employee/dashboard" 
          element={
            isAuthenticated ? (
              <EmployeeDashboardRouter />
            ) : (
              <Navigate to="/employee-login" replace />
            )
          } 
        />
        <Route 
          path="/super-admin-login" 
          element={!isAuthenticated ? <SuperAdminLogin /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register-company" 
          element={!isAuthenticated ? <CompanyRegistration /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/license-expired" 
          element={isAuthenticated ? <LicenseExpired /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/super-admin" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? (
              <SuperAdminDashboard />
            ) : (
              <Navigate to="/super-admin-login" replace />
            )
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  console.log('🚀 App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
