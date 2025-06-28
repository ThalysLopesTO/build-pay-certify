
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface EmployeeLimitAlertProps {
  employeeLimit: {
    plan: string;
    currentCount: number;
    employeeLimit: number;
    canAddEmployee: boolean;
    remainingSlots: number;
  };
}

const EmployeeLimitAlert: React.FC<EmployeeLimitAlertProps> = ({ employeeLimit }) => {
  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'starter': return 'Starter';
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return plan;
    }
  };

  return (
    <Alert className={employeeLimit.canAddEmployee ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Current Plan: {getPlanName(employeeLimit.plan)}</strong> - 
        Using {employeeLimit.currentCount} of {employeeLimit.employeeLimit} employee slots.
        {employeeLimit.canAddEmployee ? (
          <span className="text-green-600"> You can add {employeeLimit.remainingSlots} more employees.</span>
        ) : (
          <span className="text-orange-600"> Employee limit reached. Please upgrade your plan to add more employees.</span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default EmployeeLimitAlert;
