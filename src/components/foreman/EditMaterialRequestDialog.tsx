import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import JobsiteSelect from './JobsiteSelect';
import DatePickerField from './DatePickerField';
import { useMaterialRequestEdit } from '@/hooks/useMaterialRequestEdit';
import { EnrichedMaterialRequest } from '@/hooks/useMaterialRequests';

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

interface EditMaterialRequestDialogProps {
  request: EnrichedMaterialRequest;
  canEdit: boolean;
}

const EditMaterialRequestDialog: React.FC<EditMaterialRequestDialogProps> = ({
  request,
  canEdit,
}) => {
  const [open, setOpen] = React.useState(false);
  const editMutation = useMaterialRequestEdit();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsiteId: request.jobsites?.id || '',
      deliveryDate: new Date(request.delivery_date + 'T00:00:00'),
      deliveryTime: request.delivery_time,
      floorUnit: request.floor_unit || '',
      materialList: request.material_list,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await editMutation.mutateAsync({
        id: request.id,
        jobsiteId: data.jobsiteId,
        deliveryDate: data.deliveryDate,
        deliveryTime: data.deliveryTime,
        floorUnit: data.floorUnit,
        materialList: data.materialList,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Material Request</span>
          </DialogTitle>
        </DialogHeader>
        
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
                      type="time"
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMaterialRequestDialog;