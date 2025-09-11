import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { organizedCategories, loading } = useHierarchicalMaterialCategories();
  
  // Create a unified list of all categories with proper display names
  const allCategoryOptions = React.useMemo(() => {
    const options: Array<{ id: string; displayName: string; isParent: boolean }> = [];
    
    organizedCategories.forEach(parent => {
      // Add parent category
      options.push({
        id: parent.id,
        displayName: parent.name,
        isParent: true
      });
      
      // Add subcategories for this parent
      if (parent.subcategories) {
        parent.subcategories.forEach(subcategory => {
          options.push({
            id: subcategory.id,
            displayName: `${parent.name} > ${subcategory.name}`,
            isParent: false
          });
        });
      }
    });
    
    return options;
  }, [organizedCategories]);

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
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {allCategoryOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <span className={option.isParent ? "font-medium" : "text-muted-foreground pl-4"}>
                {option.displayName}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};