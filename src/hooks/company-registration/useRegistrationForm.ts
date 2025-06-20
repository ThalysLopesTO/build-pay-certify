
import { useState } from 'react';
import { RegistrationFormData } from './types';

const initialFormData: RegistrationFormData = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  password: ''
};

export const useRegistrationForm = () => {
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    handleInputChange,
    resetForm,
    setFormData
  };
};
