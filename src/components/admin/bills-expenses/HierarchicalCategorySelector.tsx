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
  const [selectedParentId, setSelectedParentId] = React.useState('');
  
  const parentCategories = getParentCategories(transactionType);
  
  // Find the selected category and determine parent/subcategory
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const currentParentId = selectedCategory?.category_level === 'subcategory' 
    ? selectedCategory.parent_category_id 
    : selectedCategory?.category_level === 'parent' 
    ? selectedCategory.id 
    : '';

  // Update internal state when external selection changes
  React.useEffect(() => {
    if (currentParentId && currentParentId !== selectedParentId) {
      setSelectedParentId(currentParentId);
    }
  }, [currentParentId, selectedParentId]);

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    // If only parent selected (no subcategory chosen), set the parent as the selected category
    onCategoryChange(parentId);
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    if (subcategoryId === 'parent-only') {
      // User chose to use only the parent category
      onCategoryChange(selectedParentId);
    } else {
      onCategoryChange(subcategoryId);
    }
  };

  const subcategories = selectedParentId ? getSubcategoriesForParent(selectedParentId) : [];
  const showSubcategorySelect = selectedParentId && subcategories.length > 0;

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <Label htmlFor="parent-category">
          Category {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={selectedParentId} onValueChange={handleParentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select parent category" />
          </SelectTrigger>
          <SelectContent>
            {parentCategories.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory Selection (only shown if parent has subcategories) */}
      {showSubcategorySelect && (
        <div>
          <Label htmlFor="subcategory">Subcategory (Optional)</Label>
          <Select 
            value={
              selectedCategory?.category_level === 'subcategory' 
                ? selectedCategory.id 
                : 'parent-only'
            } 
            onValueChange={handleSubcategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory or use parent only" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parent-only">
                Use "{parentCategories.find(p => p.id === selectedParentId)?.name}" only
              </SelectItem>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};