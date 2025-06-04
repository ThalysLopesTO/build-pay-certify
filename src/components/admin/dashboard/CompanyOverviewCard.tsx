
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

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

  const getStatusBadge = () => {
    // This would need to be enhanced with actual expiration logic
    return (
      <Badge variant="default" className="bg-green-500">
        🟢 Active
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Building className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900">
              {user?.companyName || 'Company Name'}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">📅 License Expires:</span>
            <p className="text-gray-900 mt-1">Not set</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">🆔 Plan Type:</span>
            <p className="text-gray-900 mt-1">Free Plan</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyOverviewCard;
