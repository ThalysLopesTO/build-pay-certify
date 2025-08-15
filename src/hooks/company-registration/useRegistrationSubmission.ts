
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { RegistrationFormData } from './types';
import { processPaidRegistration } from './paidRegistrationService';
import { processFreeRegistration } from './freeRegistrationService';

export const useRegistrationSubmission = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
          description: `Welcome to StackBuild! Your company "${result.companyName}" has been created and activated. Please log in to continue.`,
        });
      } else {
        await processFreeRegistration(formData);
        
        toast({
          title: "Registration Complete!",
          description: "Your company has been registered successfully. Please log in to continue.",
        });
      }

      // Redirect to login page instead of showing success page
      navigate('/login');

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
