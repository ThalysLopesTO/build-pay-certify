
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import PhotoUploadField from './employee-registration/PhotoUploadField';

const editEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  position: z.string().min(1, 'Position is required'),
  trade: z.string().min(1, 'Trade is required'),
  role: z.enum(['admin', 'foreman', 'management', 'employee']),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  workerType: z.enum(['employee', 'subcontractor']).default('subcontractor'),
  photo: z.instanceof(File).optional(),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  position: string;
  trade: string;
  role: string;
  hourly_rate: number;
  worker_type: string;
  photo_url?: string | null;
}

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess
}) => {
  const { toast } = useToast();
  
  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      firstName: employee?.first_name || '',
      lastName: employee?.last_name || '',
      position: employee?.position || '',
      trade: employee?.trade || '',
      role: (employee?.role as any) || 'employee',
      hourlyRate: employee?.hourly_rate || 0,
      workerType: (employee?.worker_type as any) || 'subcontractor',
      photo: undefined,
    },
  });

  React.useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.first_name,
        lastName: employee.last_name,
        position: employee.position,
        trade: employee.trade,
        role: employee.role as any,
        hourlyRate: employee.hourly_rate,
        workerType: (employee.worker_type as any) || 'subcontractor',
        photo: undefined,
      });
    }
  }, [employee, form]);

  const handleSubmit = async (data: EditEmployeeFormData) => {
    console.log('handleSubmit called with data:', data);
    console.log('employee object:', employee);
    if (!employee) {
      console.log('No employee found, returning early');
      return;
    }

    try {
      let photoUrl = employee.photo_url;

      // Upload new photo if provided
      if (data.photo) {
        console.log('Uploading updated employee photo...');
        const fileExtension = data.photo.name.split('.').pop();
        const fileName = `${employee.id}.${fileExtension}`;
        
        // Delete old photo if exists
        if (employee.photo_url) {
          const oldFileName = employee.photo_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage
              .from('employee-photos')
              .remove([oldFileName]);
          }
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, data.photo, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          throw new Error('Failed to upload employee photo');
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
        console.log('Photo uploaded successfully:', photoUrl);
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          position: data.position,
          trade: data.trade,
          role: data.role,
          hourly_rate: data.hourlyRate,
          worker_type: data.workerType,
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Employee Updated",
        description: `${data.firstName} ${data.lastName} has been updated successfully.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Current Photo Display */}
            <div className="flex justify-center">
              <EmployeeAvatar 
                photoUrl={employee?.photo_url}
                firstName={employee?.first_name}
                lastName={employee?.last_name}
                size="lg"
              />
            </div>

            {/* Photo Upload */}
            <PhotoUploadField form={form} />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="foreman">Foreman</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Worker Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="subcontractor">Subcontractor</SelectItem>
                      <SelectItem value="employee">Payroll Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                      <Input 
                        type="number" 
                        step="0.01"
                        className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                Update Employee
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeEditModal;
