import { CreditCard, ArrowLeft } from 'lucide-react';
import { TrialEmbedFormData } from '@/types/trialEmbed';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { toast } from 'sonner';

interface StepTwoProps {
  formData: TrialEmbedFormData;
  onBack: () => void;
}

const StepTwo = ({ formData, onBack }: StepTwoProps) => {
  const planDetails = SUBSCRIPTION_PLANS[formData.plan];

  const handleFinish = () => {
    toast.success(
      "This is a test version. In the real flow, we will process payment and redirect you to the company registration page.",
      {
        duration: 5000,
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Trial details & payment</h2>
        <p className="text-sm text-muted-foreground">Step 2 of 2</p>
      </div>

      {/* Summary Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium text-foreground">
                  {planDetails.name} - ${planDetails.price}/month
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company:</span>
                <span className="font-medium text-foreground">{formData.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium text-foreground">{formData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{formData.email}</span>
              </div>
              {formData.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium text-foreground">{formData.phone}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Plan Features:</h4>
            <ul className="text-sm space-y-1">
              {planDetails.featureList.map((feature, index) => (
                <li key={index} className="text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Payment Placeholder */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">Payment Information</h3>
          <div className="bg-muted/50 border border-border rounded-lg p-8 flex flex-col items-center justify-center space-y-3">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Stripe Payment Element will be integrated here
            </p>
            <p className="text-xs text-muted-foreground">
              Secure payment processing powered by Stripe
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleFinish}
          className="w-full"
          size="lg"
        >
          Finish & Start Trial (Test mode)
        </Button>
        
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full"
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Step 1
        </Button>
      </div>
    </div>
  );
};

export default StepTwo;
