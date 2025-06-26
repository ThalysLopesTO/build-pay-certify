
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'foreman' | 'payroll' | 'employee';
  first_name?: string;
  last_name?: string;
  company_id?: string;
  hourly_rate?: number;
  trade?: string;
  position?: string;
}

export interface Company {
  id: string;
  name: string;
  status: string;
  subscription_override?: boolean;
  stripe_verified?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  company: Company | null;
  isAuthenticated: boolean;
  loading: boolean;
  companyError: string | null;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}
