
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';

const formSchema = z.object({
  name: z.string().min(1, 'Jobsite name is required').min(2, 'Jobsite name must be at least 2 characters'),
  address: z.string().min(1, 'Address is required').min(5, 'Address must be at least 5 characters'),
  starting_date: z.string().min(1, 'Starting date is required'),
});

type FormData = z.infer<typeof formSchema>;

interface JobsiteFormProps {
  onCancel: () => void;
}

const JobsiteForm: React.FC<JobsiteFormProps> = ({ onCancel }) => {
  const { addJobsite } = useJobsiteActions();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      starting_date: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Form data being submitted:', data);
      
      // Validate required fields client-side
      if (!data.name?.trim()) {
        form.setError('name', { message: 'Jobsite name is required' });
        return;
      }
      
      if (!data.address?.trim()) {
        form.setError('address', { message: 'Address is required' });
        return;
      }

      if (!data.starting_date?.trim()) {
        form.setError('starting_date', { message: 'Starting date is required' });
        return;
      }

      await addJobsite.mutateAsync({
        name: data.name.trim(),
        address: data.address.trim(),
        starting_date: data.starting_date,
      });
      
      form.reset();
      onCancel();
    } catch (error) {
      console.error('Error adding jobsite:', error);
      
      // Handle specific error types
      if (error?.message?.includes('required')) {
        form.setError('root', { message: 'Missing required fields. Please check all fields are filled out.' });
      } else if (error?.message?.includes('duplicate')) {
        form.setError('name', { message: 'A jobsite with this name already exists.' });
      } else if (error?.message?.includes('permission')) {
        form.setError('root', { message: 'You do not have permission to add jobsites.' });
      } else {
        form.setError('root', { message: `Failed to add jobsite: ${error?.message || 'Unknown error'}` });
      }
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Add New Jobsite</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter jobsite name" 
                      {...field} 
                      required
                    />
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
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter full address" 
                      {...field} 
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="starting_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      placeholder="Select starting date" 
                      {...field} 
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={addJobsite.isPending}
              >
                {addJobsite.isPending ? 'Adding...' : 'Add Jobsite'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  onCancel();
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default JobsiteForm;
