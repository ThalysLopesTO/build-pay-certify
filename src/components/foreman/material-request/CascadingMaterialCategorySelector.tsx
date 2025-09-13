import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHierarchicalMaterialCategories } from '@/hooks/useHierarchicalMaterialCategories';

interface CascadingMaterialCategorySelectorProps {
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
}

export const CascadingMaterialCategorySelector: React.FC<CascadingMaterialCategorySelectorProps> = ({
  selectedCategoryId,
  onCategoryChange,
  required = false
}) => {
  const { getParentCategories, getSubcategoriesForParent, categories, loading } = useHierarchicalMaterialCategories();
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');

  // Initialize selection state based on selectedCategoryId
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      if (selectedCategory) {
        if (selectedCategory.category_level === 'parent') {
          setSelectedParentId(selectedCategoryId);
          setSelectedSubcategoryId('');
        } else if (selectedCategory.category_level === 'subcategory' && selectedCategory.parent_category_id) {
          setSelectedParentId(selectedCategory.parent_category_id);
          setSelectedSubcategoryId(selectedCategoryId);
        }
      }
    } else if (!selectedCategoryId) {
      setSelectedParentId('');
      setSelectedSubcategoryId('');
    }
  }, [selectedCategoryId, categories]);

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    setSelectedSubcategoryId('');
    
    // Check if this parent has subcategories
    const subcategories = getSubcategoriesForParent(parentId);
    if (subcategories.length === 0) {
      // No subcategories, use parent as final selection
      onCategoryChange(parentId);
    }
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
    onCategoryChange(subcategoryId);
  };

  const parentCategories = getParentCategories;
  const subcategories = selectedParentId ? getSubcategoriesForParent(selectedParentId) : [];
  const hasSubcategories = subcategories.length > 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading categories..." />
          </SelectTrigger>
        </Select>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {/* Parent Category Select */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          Main Category {required && <span className="text-destructive">*</span>}
        </label>
        <Select value={selectedParentId} onValueChange={handleParentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select main category" />
          </SelectTrigger>
          <SelectContent>
            {parentCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory Select */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          Subcategory
        </label>
        <Select 
          value={selectedSubcategoryId} 
          onValueChange={handleSubcategoryChange}
          disabled={!selectedParentId || !hasSubcategories}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                !selectedParentId 
                  ? "Select main category first" 
                  : !hasSubcategories 
                    ? "No subcategories available"
                    : "Select subcategory"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};