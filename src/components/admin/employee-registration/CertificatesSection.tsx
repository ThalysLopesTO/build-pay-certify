
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Shield } from 'lucide-react';
import { FormField } from '@/components/ui/form';
import DatePickerField from '@/components/foreman/DatePickerField';
import { EmployeeFormData } from './schemas';

interface CertificatesSectionProps {
  form: UseFormReturn<EmployeeFormData>;
}

const CertificatesSection: React.FC<CertificatesSectionProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b pb-2">
        <Shield className="h-4 w-4 text-blue-600" />
        <h3 className="text-lg font-semibold">Certificates</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="workAtHeightsExpiry"
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              label="Work at Heights Expiry"
              placeholder="Select expiry date"
            />
          )}
        />

        <FormField
          control={form.control}
          name="whmisExpiry"
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              label="WHMIS Expiry"
              placeholder="Select expiry date"
            />
          )}
        />

        <FormField
          control={form.control}
          name="fourStepsExpiry"
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              label="4 Steps Expiry"
              placeholder="Select expiry date"
            />
          )}
        />

        <FormField
          control={form.control}
          name="fiveStepsExpiry"
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              label="5 Steps Expiry"
              placeholder="Select expiry date"
            />
          )}
        />

        <FormField
          control={form.control}
          name="liftOperatorExpiry"
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              label="Lift Operator Expiry"
              placeholder="Select expiry date"
            />
          )}
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          <Shield className="h-4 w-4 inline mr-1" />
          Certificate expiry alerts will be triggered 30 days before any certificate expires.
        </p>
      </div>
    </div>
  );
};

export default CertificatesSection;
