
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
import { CreateSupplierData, Supplier } from '@/hooks/useSuppliers';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  supplier_type: z.string().optional(),
  contact_person: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const supplierTypes = [
  'Drywall',
  'Framing',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Flooring',
  'Roofing',
  'Concrete',
  'Steel',
  'General Materials',
  'Other'
];

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplierData) => Promise<void>;
  initialData?: Supplier | null;
  isSubmitting: boolean;
}

const SupplierForm = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }: SupplierFormProps) => {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      phone_number: initialData?.phone_number || '',
      email: initialData?.email || '',
      supplier_type: initialData?.supplier_type || '',
      contact_person: initialData?.contact_person || '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        address: initialData.address || '',
        phone_number: initialData.phone_number || '',
        email: initialData.email || '',
        supplier_type: initialData.supplier_type || '',
        contact_person: initialData.contact_person || '',
      });
    } else {
      form.reset({
        name: '',
        address: '',
        phone_number: '',
        email: '',
        supplier_type: '',
        contact_person: '',
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (data: SupplierFormData) => {
    const submitData: CreateSupplierData = {
      name: data.name,
      address: data.address || undefined,
      phone_number: data.phone_number || undefined,
      email: data.email || undefined,
      supplier_type: data.supplier_type || undefined,
      contact_person: data.contact_person || undefined,
    };
    await onSubmit(submitData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Supplier</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the' : 'Add a new'} supplier details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supplierTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact person name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
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
                    <Input placeholder="Enter full address" {...field} />
                  </FormControl>
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

export default SupplierForm;
