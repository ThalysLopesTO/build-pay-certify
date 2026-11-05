
import { CreateSuperAdminRequest } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function validateRequest(body: CreateSuperAdminRequest) {
  const errors: string[] = [];

  if (!body.email) {
    errors.push('Email is required');
  }

  if (!body.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getDefaultNames(firstName?: string, lastName?: string) {
  return {
    defaultFirstName: firstName || 'Super',
    defaultLastName: lastName || 'Admin'
  };
}

// Roles are never granted from an email address (anyone can type one).
// Super admins are created only through create-super-admin-user.
export function determineUserRole(_email: string): 'super_admin' | 'admin' {
  return 'admin';
}
