import { useState } from 'react';
import { TrialEmbedFormData, PlanId } from '@/types/trialEmbed';
import { Card } from '@/components/ui/card';
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

  const handleStepOneComplete = (data: TrialEmbedFormData) => {
    setFormData(data);
    setCurrentStep(2);
  };

  const handleBackToStepOne = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl p-6 md:p-8 shadow-lg">
        {currentStep === 1 ? (
          <StepOne initialData={formData} onNext={handleStepOneComplete} />
        ) : (
          <StepTwo formData={formData} onBack={handleBackToStepOne} />
        )}
      </Card>
    </div>
  );
};

export default TrialWizard;
