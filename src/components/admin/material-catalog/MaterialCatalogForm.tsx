import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { useMaterialCatalogMutations, MATERIAL_UNITS } from '@/hooks/useMaterialCatalog';
import { HierarchicalMaterialCategorySelector } from './HierarchicalMaterialCategorySelector';

// Form validation schema
const formSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, 'Material name is required'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
  spec_size: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface MaterialCatalogFormProps {
  item?: any;
  onClose: () => void;
}

export const MaterialCatalogForm: React.FC<MaterialCatalogFormProps> = ({
  item,
  onClose,
}) => {
  const { createItem, updateItem, isCreating, isUpdating } = useMaterialCatalogMutations();
  const isEdit = !!item;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: item?.sku || '',
      name: item?.name || '',
      unit: item?.unit || 'pcs',
      category: item?.category || '',
      spec_size: item?.spec_size || '',
      notes: item?.notes || '',
      is_active: item?.is_active ?? true,
    },
  });

  const onSubmit = (data: FormData) => {
    // Convert empty SKU string to null to avoid unique constraint violations
    const processedData = {
      ...data,
      sku: data.sku?.trim() || null,
      notes: data.notes?.trim() || null,
    };

    if (isEdit && item) {
      updateItem({
        id: item.id,
        ...processedData,
      });
    } else {
      createItem({
        name: processedData.name,
        unit: processedData.unit,
        category: processedData.category,
        sku: processedData.sku,
        spec_size: processedData.spec_size,
        notes: processedData.notes,
        is_active: processedData.is_active,
      });
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Material' : 'Add New Material'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter material name" {...field} />
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
                  <FormLabel>SKU (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter SKU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
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
                name="spec_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spec/Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2x4, 10mm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <HierarchicalMaterialCategorySelector
                    selectedCategoryId={field.value}
                    onCategoryChange={field.onChange}
                    required
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the material"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Material is available for selection
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating 
                  ? (isEdit ? 'Updating...' : 'Creating...') 
                  : (isEdit ? 'Update Material' : 'Create Material')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};