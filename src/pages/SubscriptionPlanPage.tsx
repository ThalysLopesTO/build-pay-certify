import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useStripeSubscription } from "@/hooks/useStripeSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, CheckCircle, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const handleStartSubscription = async () => {
    try {
      await createCheckout({ planName: "StackBuild Pro" });
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
      setTimeout(() => handleStartSubscription(), 600);
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

        {/* Pricing Card */}
        <div className="flex justify-center mb-12">
          <Card className="border-t-4 border-orange-500 bg-white shadow-2xl rounded-2xl relative w-full max-w-md">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                🎉 7-Day Free Trial
              </span>
            </div>
            <CardHeader className="text-center pb-6 pt-10">
              <CardTitle className="text-3xl font-bold text-slate-900 mb-4">StackBuild Pro</CardTitle>
              <div className="text-5xl font-bold text-orange-600 mb-1">$297 CAD</div>
              <div className="text-lg text-slate-500 mb-4">/month</div>
              <p className="text-slate-600 text-base">Complete Construction Management Solution</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                {[
                  "50 Employees account",
                  "Payroll & Invoice System",
                  "Certificate & Safety Tracking",
                  "Multi-role Access: Admin, Foreman, Worker",
                  "Project & Jobsite Control",
                  "Time Tracking & Timesheets",
                  "Material Request Management",
                  "Daily Reports & Analytics",
                  "Quote Generation",
                  "Mobile App Access",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-slate-700">
                    <CheckCircle className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleStartSubscription}
                disabled={isCreatingCheckout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 text-lg mb-3 shadow-lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {isCreatingCheckout ? "Processing..." : "Start 7-Day Free Trial"}
              </Button>
              <p className="text-center text-sm text-slate-500">No charge for 7 days. Cancel anytime.</p>
              {isAuthenticated && (
                <div className="mt-4 text-center">
                  <Link to="/admin-login" className="text-orange-400 hover:text-orange-300 text-sm">
                    Already have an account? Sign in
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
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
