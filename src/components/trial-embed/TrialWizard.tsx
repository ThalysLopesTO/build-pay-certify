import { useState } from 'react';
import { TrialEmbedFormData, PlanId } from '@/types/trialEmbed';
import { Card } from '@/components/ui/card';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { stripePromise } from '@/lib/stripe';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

interface TrialWizardProps {
  initialPlan: PlanId;
}

const TrialWizard = ({ initialPlan }: TrialWizardProps) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<TrialEmbedFormData>({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    plan: initialPlan,
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentType, setIntentType] = useState<'payment' | 'setup' | null>(null);
  const [registrationRequestId, setRegistrationRequestId] = useState<string | null>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  const handleStepOneComplete = async (data: TrialEmbedFormData) => {
    setIsCreatingSubscription(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke(
        'create-trial-subscription-embed',
        {
          body: {
            companyName: data.companyName,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            plan: data.plan,
          },
        }
      );

      if (error) {
        toast.error('Failed to create subscription. Please try again.');
        console.error('Subscription creation error:', error);
        return;
      }

      if (!response?.clientSecret || !response?.intentType) {
        toast.error('Invalid response from server. Please try again.');
        console.error('Missing clientSecret or intentType in response:', response);
        return;
      }

      // Store in state
      setFormData(data);
      setClientSecret(response.clientSecret);
      setIntentType(response.intentType);
      setRegistrationRequestId(response.registrationRequestId);
      
      // Move to step 2
      setCurrentStep(2);
      toast.success('Subscription created! Please complete payment.');
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Unexpected error:', err);
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleBackToStepOne = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl p-6 md:p-8 shadow-lg">
        {currentStep === 1 ? (
          <StepOne 
            initialData={formData} 
            onNext={handleStepOneComplete}
            isLoading={isCreatingSubscription}
          />
        ) : clientSecret && intentType ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StepTwo 
              formData={formData}
              clientSecret={clientSecret}
              intentType={intentType}
              registrationRequestId={registrationRequestId || ''}
              onBack={handleBackToStepOne}
            />
          </Elements>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading payment information...</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TrialWizard;
