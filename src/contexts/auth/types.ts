
import { User, Session } from '@supabase/supabase-js';

// Updated AuthUser interface to include company information
export interface AuthUser extends User {
  role?: 'super_admin' | 'admin' | 'foreman' | 'management' | 'account' | 'employee';
  companyId?: string;
  companyName?: string;
  hourlyRate?: number;
  trade?: string;
  position?: string;
  firstName?: string;
  lastName?: string;
  pendingApproval?: boolean;
  workerType?: 'employee' | 'subcontractor';
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string, expectedRole?: 'employee' | 'admin') => Promise<{ error: any }>;
  loginWithUsername: (username: string, password: string, expectedRole?: 'employee' | 'admin') => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  isCompanyAdmin: boolean;
  isSuperAdmin: boolean;
  companyError: string | null;
}
