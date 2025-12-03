import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Shield, Plus, Trash2, Upload } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import DatePickerField from '@/components/foreman/DatePickerField';
import { EmployeeFormData } from './schemas';

interface DynamicCertificatesSectionProps {
  form: UseFormReturn<EmployeeFormData>;
}

const DynamicCertificatesSection: React.FC<DynamicCertificatesSectionProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "certificates"
  });

  const addCertificate = () => {
    append({
      id: crypto.randomUUID(),
      name: '',
      expiryDate: undefined,
      noExpiry: false,
      file: undefined,
    });
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        form.setError(`certificates.${index}.file`, {
          type: 'manual',
          message: 'Only PDF, JPG, and PNG files are allowed'
        });
        return;
      }

      if (file.size > maxSize) {
        form.setError(`certificates.${index}.file`, {
          type: 'manual',
          message: 'File size must be less than 5MB'
        });
        return;
      }

      form.setValue(`certificates.${index}.file`, file);
      form.clearErrors(`certificates.${index}.file`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-3">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h3 className="text-base md:text-lg font-semibold">Certificates</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCertificate}
          className="flex items-center justify-center space-x-1 w-full md:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Certificate</span>
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No certificates added yet</p>
          <p className="text-sm">Click "Add Certificate" to add employee certificates</p>
        </div>
      )}

      <div className="space-y-3 md:space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="p-3 md:p-4">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-slate-700">Certificate #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <FormField
                  control={form.control}
                  name={`certificates.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Work at Heights, WHMIS, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name={`certificates.${index}.noExpiry`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            No Expiry Date
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!form.watch(`certificates.${index}.noExpiry`) && (
                    <FormField
                      control={form.control}
                      name={`certificates.${index}.expiryDate`}
                      render={({ field }) => (
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
                          label="Expiry Date"
                          placeholder="Select expiry date"
                        />
                      )}
                    />
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name={`certificates.${index}.file`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate File (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleFileChange(index, file);
                          }}
                          className="flex-1"
                        />
                        <Upload className="h-4 w-4 text-slate-500" />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-slate-500">
                      Supported formats: PDF, JPG, PNG (max 5MB)
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </Card>
        ))}
      </div>

      {fields.length > 0 && (
        <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
          <p className="text-xs md:text-sm text-blue-700">
            <Shield className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
            Certificate expiry alerts will be triggered 30 days before any certificate expires (certificates with "No Expiry" will be excluded from alerts).
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicCertificatesSection;