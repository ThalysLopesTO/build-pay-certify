
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

  // For employees (non-admin users), only block if company subscription is completely inactive
  if (!isCompanyAdmin) {
    // Employees get access as long as company has any form of active subscription
    const hasAnyActiveSubscription = licenseStatus?.subscriptionStatus?.subscribed || licenseStatus?.isActive;
    
    if (!hasAnyActiveSubscription) {
      return <Navigate to="/license-expired" replace />;
    }
    
    return <>{children}</>;
  }

  // For admins, check both Stripe subscription status and legacy license
  if (isCompanyAdmin && licenseStatus) {
    // Check if company has active Stripe subscription
    const hasActiveStripeSubscription = licenseStatus.subscriptionStatus?.subscribed;
    
    // If no active Stripe subscription, check legacy license
    if (!hasActiveStripeSubscription && !licenseStatus.isActive) {
      return <Navigate to="/license-expired" replace />;
    }
  }

  return <>{children}</>;
};

export default LicenseGuard;
