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

  // ✅ Redirect authenticated users with active subscription
  useEffect(() => {
    if (isAuthenticated && user) {
      const checkSubscription = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (error) throw error;

          setIsSubscribed(!!data?.subscribed);
          if (data?.subscribed) {
            navigate("/admin/dashboard");
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
          setIsSubscribed(false);
        }
      };
      checkSubscription();
    } else {
      // Not logged in → allow auto-start
      setIsSubscribed(false);
    }
  }, [isAuthenticated, user, navigate]);

  // ✅ Regular button handler (used on page)
  const handleStartSubscription = async () => {
    try {
      await createCheckout({ planName: "StackBuild Pro" });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout process");
    }
  };

  // ✅ Auto-start Stripe checkout if URL contains ?start=1
  useEffect(() => {
    if (autoStartedRef.current || isSubscribed === true) return;

    const params = new URLSearchParams(window.location.search);
    const shouldStart = params.get("start") === "1";

    if (shouldStart && !isCreatingCheckout) {
      autoStartedRef.current = true;
      handleStartSubscription();
    }
  }, [isCreatingCheckout, isSubscribed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Building className="h-12 w-12 text-orange-500 mr-4" />
            <h1 className="text-4xl font-bold text-white">StackBuild</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Complete Construction Management Platform</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            All-in-one solution for construction management. Start your 7-day free trial today.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="flex justify-center mb-12">
          <Card className="border-2 border-orange-500 bg-gradient-to-b from-orange-500/10 to-slate-800/50 backdrop-blur-sm relative w-full max-w-md">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                🎉 7-Day Free Trial
              </span>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold text-white mb-2">StackBuild Pro</CardTitle>
              <div className="text-4xl font-bold text-orange-500 mb-2">$297 CAD</div>
              <div className="text-lg text-slate-400 mb-4">/month</div>
              <p className="text-slate-300">Complete Construction Management Solution</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited employees",
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
                  <li key={index} className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleStartSubscription}
                disabled={isCreatingCheckout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 mb-2"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {isCreatingCheckout ? "Processing..." : "Start 7-Day Free Trial"}
              </Button>

              <p className="text-center text-sm text-slate-400">No charge for 7 days. Cancel anytime.</p>

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
          <p className="text-slate-400 mb-4">Already have an account?</p>
          <div className="space-x-4">
            <Link to="/admin-login">
              <Button
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              >
                Company Login
              </Button>
            </Link>
            <Link to="/employee-login">
              <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
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
