
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface StripeSessionData {
  customer_email: string;
  metadata: {
    plan_type: string;
    price_monthly: string;
    employee_limit: string;
    is_unauthenticated_signup: string;
  };
  payment_status: string;
}

export const useStripeSession = (sessionId: string | null) => {
  const [sessionData, setSessionData] = useState<StripeSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      setLoading(true);
      setError(null);

      try {
        // This would typically be an edge function call to retrieve session details
        // For now, we'll simulate the data structure
        console.log('Fetching Stripe session:', sessionId);
        
        // Simulated session data - in production, you'd call an edge function
        // that uses Stripe.checkout.sessions.retrieve(sessionId)
        const mockSessionData: StripeSessionData = {
          customer_email: 'user@example.com',
          metadata: {
            plan_type: 'basic',
            price_monthly: '49.90',
            employee_limit: '10',
            is_unauthenticated_signup: 'true'
          },
          payment_status: 'paid'
        };
        
        setSessionData(mockSessionData);
        
        toast({
          title: "Payment Successful!",
          description: "Your subscription is confirmed. Please complete your registration below.",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session details';
        setError(errorMessage);
        toast({
          title: "Session Error",
          description: "Failed to verify your payment. Please contact support if this persists.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, toast]);

  return { sessionData, loading, error };
};
