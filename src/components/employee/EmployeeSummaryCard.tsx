
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Building, MapPin, CheckCircle } from 'lucide-react';

const EmployeeSummaryCard = () => {
  const { user } = useAuth();

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-white border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Company</h3>
              <p className="text-slate-900 font-semibold text-lg">
                {user?.companyName || 'Not Assigned'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Status</h3>
              <p className="text-green-700 font-semibold text-lg flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Ready to Work
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeSummaryCard;
