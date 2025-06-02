
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useJobsites } from '@/hooks/useJobsites';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';

const formSchema = z.object({
  name: z.string().min(1, 'Jobsite name is required').min(2, 'Jobsite name must be at least 2 characters'),
  address: z.string().min(1, 'Address is required').min(5, 'Address must be at least 5 characters'),
});

type FormData = z.infer<typeof formSchema>;

const JobsiteManagement = () => {
  const [isAdding, setIsAdding] = useState(false);
  const { data: jobsites = [], isLoading } = useJobsites();
  const { addJobsite, deleteJobsite } = useJobsiteActions();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
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

      await addJobsite.mutateAsync({
        name: data.name.trim(),
        address: data.address.trim(),
      });
      
      form.reset();
      setIsAdding(false);
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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteJobsite.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting jobsite:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading jobsites...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Jobsite Management</span>
          </CardTitle>
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Jobsite</span>
          </Button>
        </CardHeader>
        
        <CardContent>
          {isAdding && (
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
                          setIsAdding(false);
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
          )}

          <div className="space-y-4">
            {jobsites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No jobsites found. Add your first jobsite to get started.
              </div>
            ) : (
              jobsites.map((jobsite) => (
                <Card key={jobsite.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{jobsite.name}</h3>
                        <p className="text-gray-600">{jobsite.address}</p>
                        <p className="text-sm text-gray-400">
                          Created: {new Date(jobsite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(jobsite.id, jobsite.name)}
                        disabled={deleteJobsite.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsiteManagement;
