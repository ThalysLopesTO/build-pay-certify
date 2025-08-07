import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { useAssignForemen, useJobsiteForemen } from '@/hooks/useJobsiteForemen';
import ForemanAssignmentSection from './ForemanAssignmentSection';

const formSchema = z.object({
  name: z.string().min(1, 'Jobsite name is required'),
  address: z.string().min(1, 'Address is required'),
  starting_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['active', 'completed']),
  assignedForemen: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditJobsiteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobsite: {
    id: string;
    name: string;
    address: string;
    starting_date?: string;
    due_date?: string;
    status: string;
  };
}

const EditJobsiteDialog: React.FC<EditJobsiteDialogProps> = ({
  isOpen,
  onClose,
  jobsite,
}) => {
  const { updateJobsite } = useJobsiteActions();
  const assignForemen = useAssignForemen();
  const { data: assignedForemen = [] } = useJobsiteForemen(jobsite.id);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: jobsite.name,
      address: jobsite.address,
      starting_date: jobsite.starting_date || '',
      due_date: jobsite.due_date || '',
      status: jobsite.status as 'active' | 'completed',
      assignedForemen: assignedForemen.map(af => af.foreman_id),
    },
  });

  // Update form when assigned foremen data loads
  React.useEffect(() => {
    if (assignedForemen.length > 0) {
      form.setValue('assignedForemen', assignedForemen.map(af => af.foreman_id));
    }
  }, [assignedForemen, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateJobsite.mutateAsync({
        id: jobsite.id,
        data: {
          name: data.name,
          address: data.address,
          starting_date: data.starting_date || undefined,
        }
      });

      // Update foreman assignments
      if (data.assignedForemen !== undefined) {
        await assignForemen.mutateAsync({
          jobsiteId: jobsite.id,
          foremanIds: data.assignedForemen
        });
      }

      onClose();
    } catch (error) {
      console.error('Error updating jobsite:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Jobsite</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="starting_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ForemanAssignmentSection control={form.control} jobsiteId={jobsite.id} />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateJobsite.isPending || assignForemen.isPending}
              >
                {(updateJobsite.isPending || assignForemen.isPending) ? 'Updating...' : 'Update Jobsite'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobsiteDialog;