import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = true 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { data: licenseStatus, isLoading: licenseLoading } = useLicenseStatus();
  const location = useLocation();

  // Show loading while checking auth or license status
  if (loading || (requireSubscription && licenseLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // If authentication is required but user doesn't exist
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Multi-company users must pick a company before entering any workspace
  if (user.needsCompanySelection) {
    return <Navigate to="/select-company" replace />;
  }

  // If subscription is required, check subscription status
  if (requireSubscription && licenseStatus) {
    const hasActiveSubscription = licenseStatus.subscriptionStatus?.subscribed || licenseStatus.isActive;
    
    // If no active subscription, redirect to subscription plans
    if (!hasActiveSubscription) {
      return <Navigate to="/subscription-plan" replace />;
    }
  }

  // Check if user has completed company registration
  // This is a basic check - you might need to adjust based on your user profile structure
  if (user && (!user.companyId || !user.companyName)) {
    // If user doesn't have company info, might need to complete registration
    // Only redirect if they're not already on the registration page
    if (!location.pathname.includes('/company/registration')) {
      return <Navigate to="/company/registration" replace />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;