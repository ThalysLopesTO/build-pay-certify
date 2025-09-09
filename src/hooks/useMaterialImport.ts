import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { ImportedMaterial } from '@/utils/materialImportUtils';
import { useMaterialCategories } from './useMaterialCategories';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const useMaterialImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: existingCategories = [] } = useMaterialCategories();

  const importMutation = useMutation({
    mutationFn: async ({ materials, existingItems }: { 
      materials: ImportedMaterial[], 
      existingItems: any[] 
    }): Promise<ImportResult> => {
      if (!user?.companyId || !user?.id) {
        throw new Error('User not authenticated');
      }

      const results: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      // First, create any missing categories
      const categoryNames = existingCategories.map(cat => cat.name);
      const newCategories = [...new Set(materials.map(m => m.category))]
        .filter(category => !categoryNames.includes(category));

      for (const categoryName of newCategories) {
        try {
          const { error } = await supabase
            .from('material_categories')
            .insert({
              name: categoryName,
              company_id: user.companyId,
              created_by: user.id,
              sort_order: existingCategories.length + newCategories.indexOf(categoryName)
            });

          if (error) {
            console.warn(`Failed to create category "${categoryName}":`, error);
          }
        } catch (error) {
          console.warn(`Failed to create category "${categoryName}":`, error);
        }
      }

      for (const material of materials) {
        try {
          const { sku, name, category, unit } = material;
          
          // Find existing item (by SKU first, then by name+category+unit)
          const existing = existingItems.find(item => {
            if (sku && item.sku) {
              return item.sku === sku;
            }
            return item.name === name && item.category === category && item.unit === unit;
          });

          if (existing) {
            // Update existing item
            const { error } = await supabase
              .from('material_catalog_items')
              .update({
                name: material.name,
                category: material.category,
                unit: material.unit,
                sku: material.sku || null,
                notes: material.notes || null,
                is_active: material.is_active,
              })
              .eq('id', existing.id)
              .eq('company_id', user.companyId); // Ensure company isolation

            if (error) throw error;
          } else {
            // Create new item
            const { error } = await supabase
              .from('material_catalog_items')
              .insert({
                name: material.name,
                category: material.category,
                unit: material.unit,
                sku: material.sku || null,
                notes: material.notes || null,
                is_active: material.is_active,
                company_id: user.companyId,
                created_by: user.id,
              });

            if (error) throw error;
          }

          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${material.name}: ${error.message}`);
        }
      }

      return results;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['material-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      
      if (result.success > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.success} items${result.failed > 0 ? `, ${result.failed} failed` : ''}.`,
        });
      }
      
      if (result.failed > 0) {
        toast({
          title: "Import Errors",
          description: `${result.failed} items failed to import. Check the error log for details.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import materials.",
        variant: "destructive",
      });
    },
  });

  return {
    importMaterials: importMutation.mutate,
    isImporting: importMutation.isPending,
    importResult: importMutation.data,
  };
};