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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useListMutations } from '@/hooks/daily-tasks/useListMutations';
import { format } from 'date-fns';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  for_date: z.string().min(1, 'Date is required'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateListDialogProps {
  jobsiteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateListDialog = ({ jobsiteId, open, onOpenChange }: CreateListDialogProps) => {
  const { createList } = useListMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      for_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: FormData) => {
    await createList.mutateAsync({
      jobsite_id: jobsiteId,
      title: data.title,
      for_date: data.for_date,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Daily Task List</DialogTitle>
          <DialogDescription>
            Create a new daily task list for this jobsite.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">List Title</Label>
            <Input
              id="title"
              placeholder="e.g., Daily Tasks - Foundation Work"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="for_date">Date</Label>
            <Input
              id="for_date"
              type="date"
              {...register('for_date')}
            />
            {errors.for_date && (
              <p className="text-sm text-destructive">{errors.for_date.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
