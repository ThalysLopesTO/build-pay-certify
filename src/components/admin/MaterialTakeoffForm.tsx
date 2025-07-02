
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobsites } from '@/hooks/useJobsites';
import { useMaterialTakeoffMutations, MaterialTakeoff, CreateMaterialTakeoff } from '@/hooks/useMaterialTakeoffs';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const formSchema = z.object({
  jobsite_id: z.string().min(1, 'Please select a jobsite'),
  material_name: z.string().min(1, 'Material name is required'),
  unit: z.string().min(1, 'Unit is required'),
  total_qty_estimated: z.number().min(0, 'Quantity must be positive'),
  unit_price: z.number().min(0, 'Price must be positive'),
});

type FormData = z.infer<typeof formSchema>;

interface MaterialTakeoffFormProps {
  takeoff?: MaterialTakeoff | null;
  onClose: () => void;
}

const MaterialTakeoffForm: React.FC<MaterialTakeoffFormProps> = ({
  takeoff,
  onClose,
}) => {
  const { user } = useAuth();
  const { data: jobsites = [] } = useJobsites();
  const { createTakeoff, updateTakeoff, isCreating, isUpdating } = useMaterialTakeoffMutations();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsite_id: takeoff?.jobsite_id || '',
      material_name: takeoff?.material_name || '',
      unit: takeoff?.unit || '',
      total_qty_estimated: takeoff?.total_qty_estimated || 0,
      unit_price: takeoff?.unit_price || 0,
    },
  });

  const onSubmit = (data: FormData) => {
    if (takeoff) {
      updateTakeoff({ id: takeoff.id, updates: data });
    } else {
      // Create the complete takeoff object
      const createData: CreateMaterialTakeoff = {
        jobsite_id: data.jobsite_id,
        material_name: data.material_name,
        unit: data.unit,
        total_qty_estimated: data.total_qty_estimated,
        unit_price: data.unit_price,
        company_id: user?.companyId || '',
        created_by: user?.id || '',
      };
      createTakeoff(createData);
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {takeoff ? 'Edit Material Takeoff' : 'Add Material Takeoff'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="jobsite_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select jobsite" />
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
              name="material_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2x4 Lumber" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., pcs, sq ft, lbs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_qty_estimated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Quantity Estimated</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) ? 'Saving...' : takeoff ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialTakeoffForm;
