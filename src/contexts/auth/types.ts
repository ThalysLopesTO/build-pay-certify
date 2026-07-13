
import { User, Session } from '@supabase/supabase-js';

// One company the user belongs to (a user_profiles row)
export interface CompanyMembership {
  companyId: string;
  companyName: string | null;
  role: 'super_admin' | 'admin' | 'foreman' | 'management' | 'account' | 'employee';
  isActive: boolean;
  pendingApproval: boolean;
  hourlyRate?: number;
  workerType?: 'employee' | 'subcontractor';
}

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
  photo_url?: string;
  dateOfBirth?: string;
  // Multi-company membership: all companies the user belongs to
  memberships?: CompanyMembership[];
  // True when the user belongs to >1 company and must pick one before proceeding
  needsCompanySelection?: boolean;
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
  needsCompanySelection: boolean;
}
