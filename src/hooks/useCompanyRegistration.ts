
import { useRegistrationForm } from './company-registration/useRegistrationForm';
import { useRegistrationSubmission } from './company-registration/useRegistrationSubmission';

export { SECRET_KEY } from './company-registration/constants';

export const useCompanyRegistration = () => {
  const { formData, handleInputChange } = useRegistrationForm();
  const { isLoading, isSubmitted, handleSubmit: submitRegistration } = useRegistrationSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRegistration(formData);
  };

  return {
    formData,
    isLoading,
    isSubmitted,
    handleInputChange,
    handleSubmit
  };
};
