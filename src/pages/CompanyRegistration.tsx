
import React from 'react';
import { useCompanyRegistration } from '@/hooks/useCompanyRegistration';
import RegistrationHeader from '@/components/registration/RegistrationHeader';
import CompanyRegistrationForm from '@/components/registration/CompanyRegistrationForm';
import RegistrationSuccess from '@/components/registration/RegistrationSuccess';
import SEO from '@/components/common/SEO';

const CompanyRegistration = () => {
  const {
    formData,
    isLoading,
    isSubmitted,
    handleInputChange,
    handleSubmit
  } = useCompanyRegistration();

  if (isSubmitted) {
    return <RegistrationSuccess />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <SEO
        title="Complete Company Registration | StackBuild"
        description="Finish onboarding your construction company on StackBuild to start managing payroll, timesheets, and crews."
        path="/company/registration"
      />
      <div className="max-w-3xl mx-auto">
        <RegistrationHeader />
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 blur-3xl -z-10 rounded-full" />
          <CompanyRegistrationForm
            formData={formData}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistration;
