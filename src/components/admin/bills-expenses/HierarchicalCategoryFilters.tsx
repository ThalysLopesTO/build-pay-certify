import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';
import { Filter, X } from 'lucide-react';

interface HierarchicalCategoryFiltersProps {
  selectedParentIds: string[];
  selectedSubcategoryIds: string[];
  onParentChange: (parentIds: string[]) => void;
  onSubcategoryChange: (subcategoryIds: string[]) => void;
  onClearAll: () => void;
}

export const HierarchicalCategoryFilters = ({
  selectedParentIds,
  selectedSubcategoryIds,
  onParentChange,
  onSubcategoryChange,
  onClearAll,
}: HierarchicalCategoryFiltersProps) => {
  const { getParentCategories, getSubcategoriesForParent } = useHierarchicalCategories();
  
  const parentCategories = getParentCategories();
  
  // Get all subcategories for selected parents
  const availableSubcategories = selectedParentIds.flatMap(parentId => 
    getSubcategoriesForParent(parentId)
  );

  const handleParentToggle = (parentId: string, checked: boolean) => {
    if (checked) {
      onParentChange([...selectedParentIds, parentId]);
    } else {
      // Remove parent and all its subcategories
      onParentChange(selectedParentIds.filter(id => id !== parentId));
      const subcategoriesToRemove = getSubcategoriesForParent(parentId).map(sub => sub.id);
      onSubcategoryChange(selectedSubcategoryIds.filter(id => !subcategoriesToRemove.includes(id)));
    }
  };

  const handleSubcategoryToggle = (subcategoryId: string, checked: boolean) => {
    if (checked) {
      onSubcategoryChange([...selectedSubcategoryIds, subcategoryId]);
    } else {
      onSubcategoryChange(selectedSubcategoryIds.filter(id => id !== subcategoryId));
    }
  };

  const getSelectedDisplayText = () => {
    const totalSelected = selectedParentIds.length + selectedSubcategoryIds.length;
    if (totalSelected === 0) return 'All Categories';
    
    const parentNames = selectedParentIds.map(id => 
      parentCategories.find(p => p.id === id)?.name || ''
    ).filter(Boolean);
    
    const subcategoryNames = selectedSubcategoryIds.map(id => 
      availableSubcategories.find(s => s.id === id)?.name || ''
    ).filter(Boolean);

    if (totalSelected <= 3) {
      return [...parentNames, ...subcategoryNames].join(', ');
    }
    
    return `${totalSelected} categories selected`;
  };

  const hasFilters = selectedParentIds.length > 0 || selectedSubcategoryIds.length > 0;

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-2" />
            {getSelectedDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Filter by Categories</Label>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={onClearAll}>
                  Clear All
                </Button>
              )}
            </div>

            {/* Parent Categories */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Parent Categories</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {parentCategories.map((parent) => (
                  <div key={parent.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`parent-${parent.id}`}
                      checked={selectedParentIds.includes(parent.id)}
                      onCheckedChange={(checked) => 
                        handleParentToggle(parent.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`parent-${parent.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {parent.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Subcategories (only for selected parents) */}
            {availableSubcategories.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Subcategories
                  <span className="text-xs ml-1">(from selected parents)</span>
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableSubcategories.map((subcategory) => {
                    const parentName = parentCategories.find(p => p.id === subcategory.parent_category_id)?.name;
                    return (
                      <div key={subcategory.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sub-${subcategory.id}`}
                          checked={selectedSubcategoryIds.includes(subcategory.id)}
                          onCheckedChange={(checked) => 
                            handleSubcategoryToggle(subcategory.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`sub-${subcategory.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          <span className="text-muted-foreground text-xs">{parentName} →</span> {subcategory.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Filters Display */}
      {hasFilters && (
        <div className="flex items-center space-x-1 flex-wrap">
          {selectedParentIds.map(parentId => {
            const parent = parentCategories.find(p => p.id === parentId);
            return parent ? (
              <Badge key={parentId} variant="secondary" className="text-xs">
                {parent.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => handleParentToggle(parentId, false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
          
          {selectedSubcategoryIds.map(subcategoryId => {
            const subcategory = availableSubcategories.find(s => s.id === subcategoryId);
            const parent = parentCategories.find(p => p.id === subcategory?.parent_category_id);
            return subcategory ? (
              <Badge key={subcategoryId} variant="outline" className="text-xs">
                {parent?.name} → {subcategory.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => handleSubcategoryToggle(subcategoryId, false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};