
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'foreman' | 'payroll' | 'employee';
  first_name?: string;
  last_name?: string;
  company_id?: string;
  company_name?: string;
  hourly_rate?: number;
  trade?: string;
  position?: string;
  pending_approval?: boolean;
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
  session: any;
  isAuthenticated: boolean;
  loading: boolean;
  companyError: string | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isCompanyAdmin: boolean;
  isSuperAdmin: boolean;
}
