import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useStripeSubscription } from "@/hooks/useStripeSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, CheckCircle, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans";

const SubscriptionPlanPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { createCheckout, isCreatingCheckout } = useStripeSubscription();
  const navigate = useNavigate();

  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const autoStartedRef = useRef(false);

  // ✅ Check subscription and redirect if already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;

        const subscribed = !!data?.subscribed;
        setIsSubscribed(subscribed);
        if (subscribed) navigate("/admin/dashboard");
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsSubscribed(false);
      }
    };

    if (isAuthenticated) {
      checkSubscription();
    } else {
      setIsSubscribed(false);
    }
  }, [isAuthenticated, user, navigate]);

  const handleStartSubscription = async (planId: string) => {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      await createCheckout({ 
        planName: plan.displayName,
        planId: planId 
      });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout process");
    }
  };

  // ✅ Auto-start checkout when ?start=1 is in URL
  useEffect(() => {
    // Wait until auth + subscription check are resolved
    if (isSubscribed === null) return;
    if (autoStartedRef.current || isSubscribed === true) return;

    const params = new URLSearchParams(window.location.search);
    const shouldStart = params.get("start") === "1";

    if (shouldStart) {
      autoStartedRef.current = true;
      // slight delay to ensure hooks & Stripe are ready
      setTimeout(() => handleStartSubscription('builder'), 600);
    }
  }, [isSubscribed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/lovable-uploads/04cf020d-b64e-49b8-ae51-022a05b6cad8.png" 
              alt="StackBuild Logo" 
              className="h-36 w-auto"
            />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Complete Construction Management Platform</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            All-in-one solution for construction management. Start your 7-day free trial today.
          </p>
        </div>

        {/* Pricing Cards - Three Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-12">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <Card 
              key={plan.id}
              className={`relative border-2 ${
                plan.popular 
                  ? 'border-orange-500 shadow-2xl transform md:scale-105' 
                  : 'border-slate-200'
              } bg-white rounded-xl transition-all hover:shadow-xl`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-2xl font-bold text-slate-900 mb-3">
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-orange-600">
                    {plan.priceDisplay}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">/month</div>
                </div>
                <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                  🎉 7-Day Free Trial
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-6">
                <ul className="space-y-3 mb-6 min-h-[280px]">
                  {plan.featureList.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-slate-700">
                      <CheckCircle className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleStartSubscription(plan.id)}
                  disabled={isCreatingCheckout}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-slate-700 hover:bg-slate-800'
                  } text-white font-semibold py-3 text-base`}
                >
                  {isCreatingCheckout ? 'Processing...' : 'Start Free Trial'}
                </Button>
                
                <p className="text-xs text-center text-slate-500 mt-3">
                  No charge for 7 days
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-600 mb-6 text-lg">Already have an account?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/admin-login">
              <Button
                variant="outline"
                className="bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-8 py-3 shadow-md"
              >
                Company Login
              </Button>
            </Link>
            <Link to="/employee-login">
              <Button 
                variant="outline" 
                className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-8 py-3 shadow-md"
              >
                Employee Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanPage;
