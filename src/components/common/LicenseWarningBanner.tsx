
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';
import { format } from 'date-fns';

const LicenseWarningBanner = () => {
  const { data: licenseStatus, isLoading } = useLicenseStatus();

  if (isLoading || !licenseStatus?.isExpiringSoon) {
    return null;
  }

  const expirationDate = licenseStatus.expiresAt ? new Date(licenseStatus.expiresAt) : null;
  const formattedDate = expirationDate ? format(expirationDate, 'MMMM d, yyyy') : '';

  return (
    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <span className="font-medium">⚠ License Expiring Soon:</span>{' '}
        Your license will expire on {formattedDate}. Please renew to avoid service interruption.
        {licenseStatus.daysUntilExpiry && (
          <span className="ml-2 text-sm">
            ({licenseStatus.daysUntilExpiry} day{licenseStatus.daysUntilExpiry !== 1 ? 's' : ''} remaining)
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default LicenseWarningBanner;
