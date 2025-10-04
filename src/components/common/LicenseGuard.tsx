
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface LicenseGuardProps {
  children: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const { data: licenseStatus, isLoading } = useLicenseStatus();
  const { user, isCompanyAdmin } = useAuth();

  if (isLoading && !licenseStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Checking license status...</p>
        </div>
      </div>
    );
  }

  // Check for trial or grace period access
  const isInTrial = licenseStatus?.subscriptionStatus?.isInTrial || false;
  const isInGracePeriod = licenseStatus?.subscriptionStatus?.isInGracePeriod || false;

  // For employees (non-admin users), only block if company subscription is completely inactive
  if (!isCompanyAdmin) {
    // Employees get access as long as company has any form of active subscription (including trial/grace)
    const hasAnyActiveSubscription = 
      licenseStatus?.subscriptionStatus?.subscribed || 
      licenseStatus?.isActive ||
      isInTrial ||
      isInGracePeriod;
    
    if (!hasAnyActiveSubscription) {
      return <Navigate to="/license-expired" replace />;
    }
    
    return <>{children}</>;
  }

  // For admins, check Stripe subscription status, trial, grace period, and legacy license
  if (isCompanyAdmin && licenseStatus) {
    // Allow access if: has active subscription, in trial, in grace period, or has active legacy license
    const hasAccess = 
      licenseStatus.subscriptionStatus?.subscribed ||
      licenseStatus.isActive ||
      isInTrial ||
      isInGracePeriod;
    
    if (!hasAccess) {
      return <Navigate to="/license-expired" replace />;
    }
  }

  return <>{children}</>;
};

export default LicenseGuard;
