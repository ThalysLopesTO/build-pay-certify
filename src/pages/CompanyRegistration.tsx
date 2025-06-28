
import React from 'react';
import { useCompanyRegistration } from '@/hooks/useCompanyRegistration';
import RegistrationHeader from '@/components/registration/RegistrationHeader';
import CompanyRegistrationForm from '@/components/registration/CompanyRegistrationForm';
import RegistrationSuccess from '@/components/registration/RegistrationSuccess';

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
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <RegistrationHeader />
        <CompanyRegistrationForm
          formData={formData}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default CompanyRegistration;
