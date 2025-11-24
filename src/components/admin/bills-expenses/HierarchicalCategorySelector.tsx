import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCategorySelector } from './MobileCategorySelector';
import { cn } from '@/lib/utils';

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
  const isMobile = useIsMobile();
  const { categories, getParentCategories, getSubcategoriesForParent } = useHierarchicalCategories();
  
  const parentCategories = getParentCategories(transactionType);
  
  // Use mobile-optimized selector on mobile devices
  if (isMobile) {
    return (
      <MobileCategorySelector
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={onCategoryChange}
        required={required}
        transactionType={transactionType}
      />
    );
  }
  
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
      <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className={cn("bg-background border-border z-50 max-h-[300px] overflow-auto pointer-events-auto")}>
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