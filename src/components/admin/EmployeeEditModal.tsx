import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Phone, MapPin, User, Briefcase, DollarSign, AlertCircle, RefreshCw, Loader2, Cake } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import PhotoUploadField from './employee-registration/PhotoUploadField';
import BirthdayDatePicker from '@/components/common/BirthdayDatePicker';
import { editEmployeeSchema, EditEmployeeFormData } from '@/components/admin/employee-edit-modal-schema';
import { useUpdateEmployee } from '@/hooks/new/useUsers';
import { useSyncAuthEmail } from '@/hooks/new/useSyncAuthEmail';
import { toast } from 'sonner';

// Parse date string safely to avoid timezone shift (e.g., "1997-04-19" → April 19, not 18)
const parseDateOfBirth = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date at noon to prevent timezone shift
  return new Date(year, month - 1, day, 12, 0, 0);
};

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  position: string;
  trade: string;
  role: string;
  hourly_rate: number;
  worker_type: string;
  photo_url?: string | null;
  date_of_birth?: string | null;
}
interface EmployeeEditModalProps {
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}
const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  onClose,
  employee,
  onSuccess
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      trade: '',
      role: 'employee',
      hourly_rate: 0,
      worker_type: 'employee',
      date_of_birth: null
    }
  });
  useEffect(() => {
    if (employee) setOpen(true);else setOpen(false);
  }, [employee]);

  // Reset form when employee changes
  React.useEffect(() => {
    if (employee) {
      form.reset({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        position: employee.position || '',
        trade: employee.trade || '',
        role: employee.role as any,
        hourly_rate: employee.hourly_rate || 0,
        worker_type: employee.worker_type as any,
        date_of_birth: parseDateOfBirth(employee.date_of_birth)
      });
    }
  }, [employee, form]);
  const mutation = useUpdateEmployee();
  const syncMutation = useSyncAuthEmail();
  const isSubmitting = mutation.isPending;
  const handleSyncEmail = () => {
    if (!employee?.user_id || !employee?.email) {
      toast.error('Sync Failed', {
        description: 'Missing user ID or email address.'
      });
      return;
    }
    syncMutation.mutate({
      userId: employee.user_id,
      email: employee.email
    });
  };
  const handleSubmit = (data: EditEmployeeFormData) => {
    if (!employee) return;
    console.log("🚀 Starting employee update process...", {
      employeeId: employee.id,
      hasPhoto: !!data.photo
    });

    // Extract photo file
    const photoFile = data.photo instanceof File ? data.photo : undefined;

    // Trigger mutation
    // Format date_of_birth as YYYY-MM-DD for database
    const formattedDateOfBirth = data.date_of_birth 
      ? `${data.date_of_birth.getFullYear()}-${String(data.date_of_birth.getMonth() + 1).padStart(2, '0')}-${String(data.date_of_birth.getDate()).padStart(2, '0')}`
      : null;

    mutation.mutate({
      id: employee.id,
      updates: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        position: data.position || undefined,
        trade: data.trade || undefined,
        role: data.role,
        hourly_rate: data.hourly_rate || undefined,
        worker_type: data.worker_type,
        date_of_birth: formattedDateOfBirth
      },
      newPhoto: photoFile,
      isEmailChanged: (employee?.email ?? "") !== (data?.email ?? "")
    }, {
      onSuccess: () => {
        console.log("✅ Employee update completed successfully");
        onSuccess();
        onClose();
      },
      onError: error => {
        console.error("❌ Error updating employee:", error);
      }
    });
  };
  if (!employee) return null;
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Employee Photo and Basic Info */}
            <div className="flex flex-col items-center space-y-4 border-b border-border pb-6">
              <EmployeeAvatar photoUrl={employee.photo_url} firstName={employee.first_name} lastName={employee.last_name} size="lg" />
              <PhotoUploadField form={form as any} />
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                <User className="h-4 w-4" />
                Personal Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({
                field
              }) => <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="last_name" render={({
                field
              }) => <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Cake className="h-4 w-4" />
                      Date of Birth
                    </FormLabel>
                    <FormControl>
                      <BirthdayDatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                <Mail className="h-4 w-4" />
                Contact Information
              </div>

              {/* Email sync warning - always show with manual trigger */}
              <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3 bg-slate-50">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-950">
                    Sync Login Email
                  </p>
                  <p className="text-sm mt-1 text-slate-950">
                    If this employee cannot log in, their authentication email may be out of sync. Click below to synchronize their login email with the profile email shown here.
                  </p>
                  <Button type="button" size="sm" variant="default" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSyncEmail} disabled={syncMutation.isPending}>
                    {syncMutation.isPending ? <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Syncing...
                      </> : <>
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Sync Login Email
                      </>}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({
                field
              }) => <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="phone" render={({
                field
              }) => <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>

              <FormField control={form.control} name="address" render={({
              field
            }) => <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter full address" className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            {/* Work Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                <Briefcase className="h-4 w-4" />
                Work Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="position" render={({
                field
              }) => <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="trade" render={({
                field
              }) => <FormItem>
                      <FormLabel>Trade/Skill</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter trade or skill" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="role" render={({
                field
              }) => <FormItem>
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
                    </FormItem>} />

                <FormField control={form.control} name="worker_type" render={({
                field
              }) => <FormItem>
                      <FormLabel>Worker Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select worker type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="subcontractor">Subcontractor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
              </div>

              <FormField control={form.control} name="hourly_rate" render={({
              field
            }) => <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Hourly Rate
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} value={field.value || ''} onChange={e => {
                  const value = e.target.value;
                  field.onChange(value === '' ? 0 : parseFloat(value));
                }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Employee'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>;
};
export default EmployeeEditModal;