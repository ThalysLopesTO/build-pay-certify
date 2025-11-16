import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import StepTwo from '@/components/trial-embed/StepTwo';
import type { TrialEmbedFormData } from '@/types/trialEmbed';

interface StepTwoWrapperProps {
  formData: TrialEmbedFormData;
  clientSecret: string;          // from edge function
  intentType: 'payment' | 'setup';
  registrationRequestId: string; // from edge function
  onBack: () => void;
}

const StepTwoWrapper = (props: StepTwoWrapperProps) => {
  const { clientSecret } = props;

  // If we don't have a clientSecret yet, don't render PaymentElement
  if (!clientSecret) {
    return <p>Loading payment form...</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' }
      }}
    >
      <StepTwo {...props} />
    </Elements>
  );
};

export default StepTwoWrapper;
