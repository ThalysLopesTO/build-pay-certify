
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';

interface LicenseGuardProps {
  children: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const { data: licenseStatus, isLoading } = useLicenseStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Checking license status...</p>
        </div>
      </div>
    );
  }

  if (licenseStatus && !licenseStatus.isActive) {
    return <Navigate to="/license-expired" replace />;
  }

  return <>{children}</>;
};

export default LicenseGuard;
