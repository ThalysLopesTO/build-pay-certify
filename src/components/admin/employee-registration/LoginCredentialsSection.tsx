
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Shield } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { EmployeeFormData } from './schemas';

interface LoginCredentialsSectionProps {
  form: UseFormReturn<EmployeeFormData>;
}

const LoginCredentialsSection: React.FC<LoginCredentialsSectionProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b pb-2">
        <Shield className="h-4 w-4 text-green-600" />
        <h3 className="text-lg font-semibold">Login Credentials</h3>
      </div>
      
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Temporary Password *</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Set initial password" {...field} />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-slate-500 mt-1">
              Employee will be required to change this password on first login
            </p>
          </FormItem>
        )}
      />
    </div>
  );
};

export default LoginCredentialsSection;
