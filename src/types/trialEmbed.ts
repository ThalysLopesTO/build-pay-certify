export interface TrialEmbedFormData {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  plan: 'start' | 'builder' | 'builder_pro';
}

export type PlanId = 'start' | 'builder' | 'builder_pro';
