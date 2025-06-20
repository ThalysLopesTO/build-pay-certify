
export interface RegistrationFormData {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  password: string;
}

export interface RegistrationResult {
  success: boolean;
  companyId?: string;
  error?: string;
}
