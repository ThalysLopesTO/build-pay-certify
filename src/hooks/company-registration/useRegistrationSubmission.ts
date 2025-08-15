
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { RegistrationFormData } from './types';
import { processPaidRegistration } from './paidRegistrationService';
import { processFreeRegistration } from './freeRegistrationService';

export const useRegistrationSubmission = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (formData: RegistrationFormData) => {
    setIsLoading(true);

    try {
      console.log('🚀 Starting company registration process...');
      
      const paymentSuccess = searchParams.get('payment') === 'success';
      const sessionId = searchParams.get('session_id');
      
      console.log('💳 Payment status:', { paymentSuccess, sessionId });

      if (paymentSuccess && sessionId) {
        const result = await processPaidRegistration(formData, sessionId);
        
        toast({
          title: "Registration Complete!",
          description: `Welcome to StackBuild! Your company "${result.companyName}" has been created and activated with a Starter plan (5 employees).`,
        });
      } else {
        await processFreeRegistration(formData);
        
        toast({
          title: "Registration Submitted",
          description: "Your company registration has been submitted for approval.",
        });
      }

      setIsSubmitted(true);

    } catch (error) {
      console.error('💥 Registration error:', error);
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isSubmitted,
    handleSubmit
  };
};
