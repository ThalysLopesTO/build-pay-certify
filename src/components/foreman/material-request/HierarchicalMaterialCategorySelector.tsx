import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useHierarchicalMaterialCategories } from '@/hooks/useHierarchicalMaterialCategories';

interface HierarchicalMaterialCategorySelectorProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
}

export const HierarchicalMaterialCategorySelector = ({
  selectedCategoryId,
  onCategoryChange,
  required = false
}: HierarchicalMaterialCategorySelectorProps) => {
  const { organizedCategories, loading, getCategoryDisplay } = useHierarchicalMaterialCategories();

  if (loading) {
    return (
      <div>
        <Label htmlFor="category">
          Category {required && <span className="text-destructive">*</span>}
        </Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading categories..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="category">
        Category {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category">
            {selectedCategoryId && getCategoryDisplay(selectedCategoryId)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizedCategories.map((parent) => (
            <SelectGroup key={parent.id}>
              {parent.subcategories && parent.subcategories.length > 0 ? (
                <>
                  <SelectLabel className="font-semibold text-foreground px-2 py-1.5">
                    {parent.name}
                  </SelectLabel>
                  {parent.subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id} className="pl-6">
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </>
              ) : (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name}
                </SelectItem>
              )}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};