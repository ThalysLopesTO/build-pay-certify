
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import CompanyStatusBadge from '@/components/admin/CompanyStatusBadge';

const CompanyOverviewCard = () => {
  const { user } = useAuth();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Building className="h-8 w-8 text-orange-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              {user?.companyName || 'Company Name'}
            </CardTitle>
            <CompanyStatusBadge status="active" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-sm font-medium text-gray-600">License Expiration</span>
            <p className="text-lg text-gray-900 mt-1">Not set</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Plan Type</span>
            <p className="text-lg text-gray-900 mt-1">Free Plan</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyOverviewCard;
