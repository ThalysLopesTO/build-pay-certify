
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Building, MapPin } from 'lucide-react';

const EmployeeSummaryCard = () => {
  const { user } = useAuth();

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-slate-700">Company</h3>
              <p className="text-slate-900 font-semibold">
                {user?.companyName || 'Not Assigned'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-slate-700">Current Status</h3>
              <p className="text-slate-900 font-semibold">Ready to Work</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeSummaryCard;
