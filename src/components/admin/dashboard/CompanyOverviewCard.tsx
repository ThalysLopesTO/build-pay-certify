
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Building className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                {user?.companyName || 'Company Name'}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <CompanyStatusBadge status="active" />
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Edit Company</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-600">License Status</span>
            <p className="text-lg font-semibold text-gray-900">Active License</p>
            <p className="text-sm text-gray-500">Expires: Not set</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-600">Current Plan</span>
            <p className="text-lg font-semibold text-gray-900">Free Plan</p>
            <p className="text-sm text-gray-500">Basic features included</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyOverviewCard;
