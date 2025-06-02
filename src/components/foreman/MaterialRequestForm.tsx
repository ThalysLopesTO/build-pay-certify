import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  deliveryDate: z.date({
    required_error: 'Please select a delivery date',
  }),
  deliveryTime: z.string().min(1, 'Please enter the delivery time'),
  floorUnit: z.string().optional(),
  materialList: z.string().min(1, 'Please enter the material list'),
});

type FormData = z.infer<typeof formSchema>;

const MaterialRequestForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      floorUnit: '',
      materialList: '',
      deliveryTime: '',
    },
  });

  // Fetch jobsites
  const { data: jobsites = [], isLoading: jobsitesLoading, error: jobsitesError } = useQuery({
    queryKey: ['jobsites'],
    queryFn: async () => {
      console.log('Fetching jobsites...');
      const { data, error } = await supabase
        .from('jobsites')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching jobsites:', error);
        throw error;
      }
      console.log('Jobsites fetched:', data);
      return data;
    },
  });

  // Submit material request
  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('material_requests')
        .insert({
          jobsite_id: data.jobsiteId,
          delivery_date: format(data.deliveryDate, 'yyyy-MM-dd'),
          delivery_time: data.deliveryTime,
          floor_unit: data.floorUnit || null,
          material_list: data.materialList,
          submitted_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Material Request Submitted',
        description: 'Your material request has been sent to the admin team.',
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
    },
    onError: (error) => {
      console.error('Error submitting material request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit material request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  // Debug logging
  console.log('Jobsites data:', jobsites);
  console.log('Jobsites loading:', jobsitesLoading);
  console.log('Jobsites error:', jobsitesError);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Material Request Form</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="jobsiteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a jobsite" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white z-50">
                      {jobsitesLoading ? (
                        <SelectItem value="loading" disabled>Loading jobsites...</SelectItem>
                      ) : jobsitesError ? (
                        <SelectItem value="error" disabled>Error loading jobsites</SelectItem>
                      ) : jobsites.length === 0 ? (
                        <SelectItem value="empty" disabled>No jobsites available</SelectItem>
                      ) : (
                        jobsites.map((jobsite) => (
                          <SelectItem key={jobsite.id} value={jobsite.id}>
                            {jobsite.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Delivery Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a delivery date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Time</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 9:00 AM, 2:30 PM, 14:00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="floorUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor / Unit (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 3rd Floor, Unit 205" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="materialList"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material List</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter detailed list of materials needed..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Material Request'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MaterialRequestForm;
