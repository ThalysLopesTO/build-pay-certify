
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User, Badge } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const EmployeeSummaryCard = () => {
  const { user } = useAuth();

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Employee Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">Company</span>
          </div>
          <span className="text-sm font-medium text-slate-800">
            {user?.company_name || 'Not Available'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">Role</span>
          </div>
          <span className="text-sm font-medium text-slate-800 capitalize">
            {user?.role || 'Employee'}
          </span>
        </div>

        {user?.trade && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Trade</span>
            <span className="text-sm font-medium text-slate-800">
              {user.trade}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeSummaryCard;
