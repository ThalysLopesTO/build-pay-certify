
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Building } from 'lucide-react';

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentSuccess = searchParams.get('payment') === 'success';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              {paymentSuccess ? 'Registration Complete!' : 'Registration Submitted!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {paymentSuccess ? (
              <>
                <div className="flex items-center justify-center space-x-2 text-orange-600 mb-4">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold">Payment Confirmed</span>
                </div>
                <p className="text-slate-600 mb-6">
                  Your payment has been processed and your StackBuild account is now active. 
                  You can sign in immediately and start using all features.
                </p>
                <div className="space-y-3">
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>✅ Company account created and activated</p>
                    <p>✅ Admin user account created</p>
                    <p>✅ StackBuild subscription active</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-2 text-slate-600 mb-4">
                  <Building className="h-5 w-5" />
                  <span className="font-semibold">Awaiting Approval</span>
                </div>
                <p className="text-slate-600 mb-6">
                  Thank you for submitting your company registration. Your request is being reviewed 
                  and you will receive an email notification once your account has been approved.
                </p>
                <div className="text-sm text-slate-500 space-y-1">
                  <p>📧 Check your email for updates</p>
                  <p>⏱️ Approval typically takes 1-2 business days</p>
                  <p>❓ Contact support if you have questions</p>
                </div>
              </>
            )}
            
            <div className="pt-4 border-t">
              <Link to={paymentSuccess ? "/login" : "/"}>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  {paymentSuccess ? 'Sign In Now' : 'Return to Home'}
                </Button>
              </Link>
            </div>
            
            {!paymentSuccess && (
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Want to get started immediately?
                </p>
                <Link to="/">
                  <Button variant="outline" size="sm">
                    Subscribe to StackBuild
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
