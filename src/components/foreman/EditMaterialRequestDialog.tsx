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
import FileUploadField from './FileUploadField';
import { useMaterialRequestEdit } from '@/hooks/useMaterialRequestEdit';
import { useMaterialRequestAttachments, useUploadMaterialRequestAttachments, useDeleteMaterialRequestAttachment } from '@/hooks/useMaterialRequestAttachments';
import { EnrichedMaterialRequest } from '@/hooks/useMaterialRequests';

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  deliveryDate: z.date({
    required_error: 'Please select a delivery date',
  }),
  deliveryTime: z.string().min(1, 'Please enter the delivery time'),
  floorUnit: z.string().optional(),
  materialList: z.string().min(1, 'Please enter the material list'),
  photos: z.array(z.any()).optional(),
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
  const uploadMutation = useUploadMaterialRequestAttachments();
  const deleteMutation = useDeleteMaterialRequestAttachment();
  const { data: existingAttachments = [] } = useMaterialRequestAttachments(request.id);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsiteId: request.jobsites?.id || '',
      deliveryDate: new Date(request.delivery_date + 'T00:00:00'),
      deliveryTime: request.delivery_time,
      floorUnit: request.floor_unit || '',
      materialList: request.material_list,
      photos: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Update the material request first
      await editMutation.mutateAsync({
        id: request.id,
        jobsiteId: data.jobsiteId,
        deliveryDate: data.deliveryDate,
        deliveryTime: data.deliveryTime,
        floorUnit: data.floorUnit,
        materialList: data.materialList,
      });

      // Upload new photos if any
      if (data.photos && data.photos.length > 0) {
        await uploadMutation.mutateAsync({
          files: data.photos,
          materialRequestId: request.id,
        });
      }

      setOpen(false);
      form.reset({
        jobsiteId: request.jobsites?.id || '',
        deliveryDate: new Date(request.delivery_date + 'T00:00:00'),
        deliveryTime: request.delivery_time,
        floorUnit: request.floor_unit || '',
        materialList: request.material_list,
        photos: [],
      });
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    try {
      await deleteMutation.mutateAsync({
        attachmentId,
        filePath,
      });
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

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Current Photos ({existingAttachments.length})</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {existingAttachments.map((attachment) => (
                    <div key={attachment.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {attachment.file_type.startsWith('image/') ? (
                          <img
                            src={`https://qsqjwpajvcmahoamwwww.supabase.co/storage/v1/object/public/material-request-attachments/${attachment.file_path}`}
                            alt={attachment.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-500 text-center p-2">
                              {attachment.file_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment.id, attachment.file_path)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={deleteMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="photos"
              render={({ field }) => (
                <FileUploadField
                  value={field.value || []}
                  onChange={field.onChange}
                  disabled={editMutation.isPending || uploadMutation.isPending}
                />
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
                disabled={editMutation.isPending || uploadMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {editMutation.isPending || uploadMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMaterialRequestDialog;