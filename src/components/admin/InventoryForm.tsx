
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useJobsites } from '@/hooks/useJobsites';
import { CreateInventoryItem, InventoryItem } from '@/hooks/useInventory';

const inventorySchema = z.object({
  jobsite_id: z.string().min(1, 'Jobsite is required'),
  equipment_name: z.string().min(1, 'Equipment name is required'),
  brand: z.string().min(1, 'Brand is required'),
  sku: z.string().min(1, 'SKU is required'),
  start_date: z.string().min(1, 'Start date is required'),
  return_date: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventoryItem) => Promise<void>;
  initialData?: InventoryItem | null;
  isSubmitting: boolean;
}

const InventoryForm = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }: InventoryFormProps) => {
  const { data: jobsites = [] } = useJobsites();

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      jobsite_id: initialData?.jobsite_id || '',
      equipment_name: initialData?.equipment_name || '',
      brand: initialData?.brand || '',
      sku: initialData?.sku || '',
      start_date: initialData?.start_date || '',
      return_date: initialData?.return_date || '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        jobsite_id: initialData.jobsite_id,
        equipment_name: initialData.equipment_name,
        brand: initialData.brand,
        sku: initialData.sku,
        start_date: initialData.start_date,
        return_date: initialData.return_date || '',
      });
    } else {
      form.reset({
        jobsite_id: '',
        equipment_name: '',
        brand: '',
        sku: '',
        start_date: '',
        return_date: '',
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (data: InventoryFormData) => {
    // Ensure all required fields are present
    const submitData: CreateInventoryItem = {
      jobsite_id: data.jobsite_id,
      equipment_name: data.equipment_name,
      brand: data.brand,
      sku: data.sku,
      start_date: data.start_date,
      return_date: data.return_date || null,
    };
    await onSubmit(submitData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the' : 'Add a new'} inventory item details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="jobsite_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a jobsite" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobsites.map((jobsite) => (
                        <SelectItem key={jobsite.id} value={jobsite.id}>
                          {jobsite.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter equipment name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter SKU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="return_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Return Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryForm;
