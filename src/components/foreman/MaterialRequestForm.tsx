
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import JobsiteSelect from './JobsiteSelect';
import DatePickerField from './DatePickerField';
import { useMaterialRequestSubmission } from '@/hooks/useMaterialRequestSubmission';

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
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      floorUnit: '',
      materialList: '',
      deliveryTime: '',
    },
  });

  const submitMutation = useMaterialRequestSubmission();

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
    form.reset();
  };

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
                <JobsiteSelect
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />

            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <DatePickerField
                  value={field.value}
                  onChange={field.onChange}
                  label="Delivery Date"
                  placeholder="Pick a delivery date"
                />
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
