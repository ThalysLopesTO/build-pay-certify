import React from 'react';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: 'billsExpenses' | 'materialRequests' | 'personalSupport' | 'customSupport';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback 
}) => {
  const { data: features, isLoading } = usePlanFeatures();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const hasAccess = features?.[feature] ?? false;

  if (!hasAccess) {
    return fallback || (
      <Card className="border-orange-200 bg-orange-50 shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-orange-100 p-4">
              <Lock className="h-12 w-12 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Feature Not Available
              </h3>
              <p className="text-slate-600 mb-4 max-w-md">
                This feature is not included in your current plan. 
                Upgrade to <strong>Builder</strong> or <strong>Builder Pro</strong> to unlock it.
              </p>
              <Button 
                onClick={() => navigate('/subscription-plan')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3"
              >
                View Plans & Upgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
