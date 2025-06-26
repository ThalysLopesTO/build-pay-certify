
import { useRegistrationForm } from './company-registration/useRegistrationForm';
import { useRegistrationSubmission } from './company-registration/useRegistrationSubmission';

export { SECRET_KEY } from './company-registration/constants';

export const useCompanyRegistration = () => {
  const { formData, handleInputChange, setFormData } = useRegistrationForm();
  const { isLoading, isSubmitted, handleSubmit: submitRegistration } = useRegistrationSubmission();

  const handleSubmit = async (e: React.FormEvent, sessionData?: any) => {
    e.preventDefault();
    await submitRegistration(formData, sessionData);
  };

  return {
    formData,
    isLoading,
    isSubmitted,
    handleInputChange,
    handleSubmit,
    setFormData
  };
};
