import { useState } from "react";
import { PlanId, TrialEmbedFormData } from "@/types/trialEmbed";
import StepOne from "./StepOne";
import StepTwoWrapper from "@/pages/start-trial-embed/StepTwoWrapper";
import { toast } from "sonner";

interface TrialWizardProps {
  initialPlan: PlanId;
}

const TrialWizard = ({ initialPlan }: TrialWizardProps) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<TrialEmbedFormData>({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    plan: initialPlan,
  });
  const [clientSecret, setClientSecret] = useState<string>("");
  const [intentType, setIntentType] = useState<"payment" | "setup">("setup");
  const [registrationRequestId, setRegistrationRequestId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStepOneNext = async (data: TrialEmbedFormData) => {
    setIsLoading(true);
    try {
      // Call edge function to create subscription and get clientSecret
      const response = await fetch("/api/create-trial-subscription-embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data.companyName,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          plan: data.plan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const result = await response.json();
      
      setFormData(data);
      setClientSecret(result.clientSecret);
      setIntentType(result.intentType);
      setRegistrationRequestId(result.registrationRequestId);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error(error instanceof Error ? error.message : "Failed to proceed to payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepTwoBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {currentStep === 1 && (
          <StepOne
            initialData={formData}
            onNext={handleStepOneNext}
            isLoading={isLoading}
          />
        )}
        {currentStep === 2 && (
          <StepTwoWrapper
            formData={formData}
            clientSecret={clientSecret}
            intentType={intentType}
            registrationRequestId={registrationRequestId}
            onBack={handleStepTwoBack}
          />
        )}
      </div>
    </div>
  );
};

export default TrialWizard;
