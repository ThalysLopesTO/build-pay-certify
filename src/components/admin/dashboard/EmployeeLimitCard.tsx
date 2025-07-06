
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle } from 'lucide-react';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';

const EmployeeLimitCard: React.FC = () => {
  const { data: employeeLimit, isLoading, error } = useEmployeeLimit();

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !employeeLimit) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm">Unable to load employee limit</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentCount, employeeLimit: limit, canAddEmployee, plan } = employeeLimit;
  const usagePercentage = limit > 0 ? (currentCount / limit) * 100 : 0;

  const getPlanName = (planCode: string) => {
    switch (planCode) {
      case 'starter': return 'Starter';
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return planCode;
    }
  };

  const getBorderColor = () => {
    if (!canAddEmployee) return 'border-red-200 bg-red-50';
    if (usagePercentage >= 80) return 'border-orange-200 bg-orange-50';
    return 'border-green-200 bg-green-50';
  };

  const getTextColor = () => {
    if (!canAddEmployee) return 'text-red-700';
    if (usagePercentage >= 80) return 'text-orange-700';
    return 'text-green-700';
  };

  return (
    <Card className={`${getBorderColor()} shadow-sm`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Employee Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">
              {currentCount} / {limit}
            </span>
            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {getPlanName(plan)} Plan
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                !canAddEmployee ? 'bg-red-500' : 
                usagePercentage >= 80 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>

          {/* Status message */}
          <div className={`text-xs ${getTextColor()} dark:text-red-300`}>
            {!canAddEmployee ? (
              <div className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span className="dark:text-white">Employee limit reached. Upgrade your plan to add more employees.</span>
              </div>
            ) : usagePercentage >= 80 ? (
              <span className="dark:text-white">Approaching employee limit ({Math.round(usagePercentage)}% used)</span>
            ) : (
              <span className="dark:text-white">{limit - currentCount} slots remaining</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeLimitCard;
