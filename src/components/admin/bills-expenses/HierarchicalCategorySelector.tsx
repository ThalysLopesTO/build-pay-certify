import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';

interface HierarchicalCategorySelectorProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
  transactionType?: 'income' | 'expense';
}

export const HierarchicalCategorySelector = ({
  selectedCategoryId,
  onCategoryChange,
  required = false,
  transactionType = 'expense'
}: HierarchicalCategorySelectorProps) => {
  const { categories, getParentCategories, getSubcategoriesForParent } = useHierarchicalCategories();
  
  const parentCategories = getParentCategories(transactionType);
  
  // Create a unified list of all categories with proper display names
  const allCategoryOptions = React.useMemo(() => {
    const options: Array<{ id: string; displayName: string; isParent: boolean }> = [];
    
    parentCategories.forEach(parent => {
      // Add parent category
      options.push({
        id: parent.id,
        displayName: parent.name,
        isParent: true
      });
      
      // Add subcategories for this parent
      const subcategories = getSubcategoriesForParent(parent.id);
      subcategories.forEach(subcategory => {
        options.push({
          id: subcategory.id,
          displayName: `${parent.name} > ${subcategory.name}`,
          isParent: false
        });
      });
    });
    
    return options;
  }, [parentCategories, getSubcategoriesForParent]);

  const handleCategoryChange = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  return (
    <div>
      <Label htmlFor="category">
        Category {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {allCategoryOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <span className={option.isParent ? "font-medium" : "text-muted-foreground"}>
                {option.displayName}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};