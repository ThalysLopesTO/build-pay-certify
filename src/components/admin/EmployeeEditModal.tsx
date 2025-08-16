
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import PhotoUploadField from './employee-registration/PhotoUploadField';
import { useEmployees } from '@/contexts/EmployeeContext';

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
  const { updateEmployee } = useEmployees();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      position: '',
      trade: '',
      role: 'employee',
      hourlyRate: 0,
      workerType: 'subcontractor',
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
    if (isSubmitting || !employee) return;
    
    setIsSubmitting(true);
    try {
      await updateEmployee(employee.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        position: data.position,
        trade: data.trade,
        role: data.role,
        hourly_rate: data.hourlyRate,
        worker_type: data.workerType,
        photo_url: employee.photo_url,
      }, data.photo);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setIsSubmitting(false);
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select worker type" />
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
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Employee'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeEditModal;
