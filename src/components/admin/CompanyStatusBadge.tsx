
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CompanyStatusBadgeProps {
  status: string;
  isExpired?: boolean;
  daysUntilExpiry?: number | null;
}

const CompanyStatusBadge: React.FC<CompanyStatusBadgeProps> = ({ 
  status, 
  isExpired, 
  daysUntilExpiry 
}) => {
  if (isExpired) {
    return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">🔔 Expired</Badge>;
  }

  if (daysUntilExpiry !== null && daysUntilExpiry !== undefined && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
    return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">⚠️ Expires in {daysUntilExpiry} days</Badge>;
  }

  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">✅ Active</Badge>;
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">⌛ Pending</Badge>;
    case 'rejected':
      return <Badge variant="destructive">❌ Rejected</Badge>;
    case 'revoked':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">🚫 Revoked</Badge>;
    case 'inactive':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">⏸️ Inactive</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default CompanyStatusBadge;
