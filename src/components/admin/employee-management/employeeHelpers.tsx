import React from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-red-500';
    case 'foreman':
      return 'bg-blue-500';
    case 'management':
      return 'bg-green-500';
    default:
      return 'bg-slate-500';
  }
};

// Mock function to determine certificate status
export const getCertStatus = (): string => {
  const statuses = ['all-valid', 'expiring', 'expired'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

export const getCertStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'all-valid':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'expiring':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'expired':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'no-certificates':
      return <Shield className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Shield className="h-4 w-4 text-muted-foreground" />;
  }
};

export const getCertStatusText = (status: string): string => {
  switch (status) {
    case 'all-valid':
      return 'All Valid';
    case 'expiring':
      return 'Expiring Soon';
    case 'expired':
      return 'Has Expired';
    case 'no-certificates':
      return 'No certificates';
    default:
      return 'Unknown';
  }
};