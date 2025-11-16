import { useState, FormEvent } from "react";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { TrialEmbedFormData } from "@/types/trialEmbed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans";
import { toast } from "sonner";

interface StepTwoProps {
  formData: TrialEmbedFormData;
  intentType: "payment" | "setup";
  registrationRequestId: string;
  onBack: () => void;
}

const StepTwo = ({ formData, intentType, registrationRequestId, onBack }: StepTwoProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const planDetails = SUBSCRIPTION_PLANS[formData.plan];

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      if (intentType === "payment") {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + "/start-trial-embed?success=true",
          },
          redirect: "if_required",
        });

        if (error) {
          toast.error(error.message || "Payment failed");
          console.error("Payment error:", error);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          setPaymentSucceeded(true);
          toast.success("✅ Payment confirmed!");
        }
      } else {
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: window.location.origin + "/start-trial-embed?success=true",
          },
          redirect: "if_required",
        });

        if (error) {
          toast.error(error.message || "Setup failed");
          console.error("Setup error:", error);
        } else if (setupIntent && setupIntent.status === "succeeded") {
          setPaymentSucceeded(true);
          toast.success("✅ Payment method confirmed!");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error("Payment error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSucceeded) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-semibold text-foreground">Payment Confirmed!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          ✅ Payment confirmed in live mode. Next we will connect this with the real company registration flow.
        </p>
        <p className="text-xs text-muted-foreground">Registration Request ID: {registrationRequestId}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Trial details & payment</h2>
        <p className="text-sm text-muted-foreground">Step 2 of 2</p>
      </div>

      {/* Summary */}
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

      {/* Payment Element */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">Payment Information</h3>
          <div className="space-y-4">
            <PaymentElement />
            <p className="text-xs text-muted-foreground">
              Your card will be charged after the 14-day trial period ends. You can cancel anytime.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <Button type="submit" className="w-full" size="lg" disabled={!stripe || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing payment...
            </>
          ) : (
            "Confirm and Start Trial"
          )}
        </Button>

        <Button onClick={onBack} type="button" variant="ghost" className="w-full" size="lg" disabled={isProcessing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Step 1
        </Button>
      </div>
    </form>
  );
};

export default StepTwo;
