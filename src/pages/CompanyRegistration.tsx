
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompanyRegistration } from '@/hooks/useCompanyRegistration';
import { useStripeSession } from '@/hooks/useStripeSession';
import RegistrationHeader from '@/components/registration/RegistrationHeader';
import CompanyRegistrationForm from '@/components/registration/CompanyRegistrationForm';
import RegistrationSuccess from '@/components/registration/RegistrationSuccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, Users } from 'lucide-react';

const CompanyRegistration = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { sessionData, loading: sessionLoading, error: sessionError } = useStripeSession(sessionId);
  
  const {
    formData,
    isLoading,
    isSubmitted,
    handleInputChange,
    handleSubmit,
    setFormData
  } = useCompanyRegistration();

  // Pre-fill email when session data is available
  useEffect(() => {
    if (sessionData?.customer_email && !formData.companyEmail) {
      setFormData(prev => ({
        ...prev,
        companyEmail: sessionData.customer_email,
        adminEmail: sessionData.customer_email
      }));
    }
  }, [sessionData, formData.companyEmail, setFormData]);

  if (isSubmitted) {
    return <RegistrationSuccess />;
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-slate-600">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'premium': return Crown;
      case 'basic': return Users;
      default: return Users;
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'basic': return 'Basic Plan';
      case 'premium': return 'Premium Plan';
      case 'enterprise': return 'Enterprise Plan';
      default: return 'Selected Plan';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <RegistrationHeader />
        
        {/* Subscription Confirmation Card */}
        {sessionData && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-800">Subscription Confirmed!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {React.createElement(getPlanIcon(sessionData.metadata.plan_type), {
                    className: "h-6 w-6 text-green-600"
                  })}
                  <div>
                    <h3 className="font-semibold text-green-800">
                      {getPlanName(sessionData.metadata.plan_type)}
                    </h3>
                    <p className="text-sm text-green-600">
                      ${sessionData.metadata.price_monthly}/month • Up to {sessionData.metadata.employee_limit} employees
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-green-700 mt-3">
                Complete your registration below to access your new account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <CompanyRegistrationForm
          formData={formData}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={(e) => handleSubmit(e, sessionData)}
          sessionData={sessionData}
        />
      </div>
    </div>
  );
};

export default CompanyRegistration;
