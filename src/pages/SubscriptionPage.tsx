import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Building, Star, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useToast } from '@/hooks/use-toast';


const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const { createCheckout, isCreatingCheckout } = useStripeSubscription();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast({
        title: "Payment successful!",
        description: "Your subscription has been activated.",
      });
    } else if (payment === 'cancelled') {
      toast({
        title: "Payment cancelled",
        description: "Your subscription was not activated.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleStartBasicSubscription = async () => {
    try {
      await createCheckout({ planName: 'Basic' });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartPremiumSubscription = async () => {
    try {
      await createCheckout({ planName: 'Premium' });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
          <p className="text-lg text-muted-foreground mb-6">
            You're already logged in. Redirecting you to your dashboard...
          </p>
          <Link to="/admin">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your construction management needs. All plans include core features with varying levels of support and capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Basic Plan */}
        <Card className="relative">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Basic</CardTitle>
            <CardDescription>Perfect for small teams</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Up to 10 employees</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Basic project management</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Time tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Email support</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Mobile app access</span>
              </div>
            </div>
            <Button 
              className="w-full mt-6" 
              onClick={handleStartBasicSubscription}
              disabled={isCreatingCheckout}
            >
              {isCreatingCheckout ? "Processing..." : "Subscribe to Basic"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-primary shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
          </div>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>Best for growing businesses</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Up to 50 employees</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Advanced project management</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Time tracking & reporting</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>API access</span>
              </div>
            </div>
            <Button 
              className="w-full mt-6" 
              onClick={handleStartPremiumSubscription}
              disabled={isCreatingCheckout}
            >
              {isCreatingCheckout ? "Processing..." : "Subscribe to Premium"}
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="relative">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-yellow-100 rounded-full w-fit">
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Enterprise</CardTitle>
            <CardDescription>For large organizations</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">Custom</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Unlimited employees</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Custom integrations</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Dedicated support</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>On-premise deployment</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Custom training</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>SLA guarantee</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6">
              Contact Us
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">
          Already have an account?
        </p>
        <Link to="/login">
          <Button variant="outline">Sign In</Button>
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionPage;