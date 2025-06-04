
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/SupabaseAuthContext";
import LoginForm from "./components/LoginForm";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForemanDashboard from "./pages/ForemanDashboard";
import NotFound from "./pages/NotFound";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const CompanyErrorFallback = ({ error, onLogout }: { error: string; onLogout: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
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
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
      <p>Loading...</p>
    </div>
  </div>
);

const DashboardRouter = () => {
  const { user, loading, companyError, logout } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  if (companyError) {
    return <CompanyErrorFallback error={companyError} onLogout={logout} />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Route based on user role
  if (user.role === 'admin' || user.role === 'payroll') {
    return <AdminDashboard />;
  } else if (user.role === 'foreman') {
    return <ForemanDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
};

const AppContent = () => {
  const { isAuthenticated, loading, companyError, logout } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (companyError && isAuthenticated) {
    return <CompanyErrorFallback error={companyError} onLogout={logout} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginForm /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <DashboardRouter />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
