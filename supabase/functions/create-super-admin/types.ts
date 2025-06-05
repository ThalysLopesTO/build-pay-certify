export interface CreateSuperAdminRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  companyName?: string;
}

export interface CreateSuperAdminResponse {
  success: boolean;
  user?: any;
  profile?: any;
  message: string;
  status: number;
  error?: string;
  details?: any;
}

export interface UserProfile {
  user_id: string;
  company_id: string;
  role: string;
  first_name: string;
  last_name: string;
  pending_approval: boolean;
}
