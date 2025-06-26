
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { RegistrationFormData } from './types';
import { processPaidRegistration } from './paidRegistrationService';
import { processFreeRegistration } from './freeRegistrationService';

export const useRegistrationSubmission = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (formData: RegistrationFormData, sessionData?: any) => {
    setIsLoading(true);

    try {
      console.log('🚀 Starting company registration process...');
      
      if (sessionData && sessionData.metadata.is_unauthenticated_signup === 'true') {
        // Handle post-checkout registration
        console.log('💳 Processing post-checkout registration:', sessionData);
        
        const result = await processPaidRegistration(formData, null, sessionData);
        
        toast({
          title: "Registration Complete!",
          description: `Welcome to StackBuild! Your company "${result.companyName}" has been created and activated with your ${sessionData.metadata.plan_type} plan.`,
        });
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        // Handle regular free registration
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
