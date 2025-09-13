import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHierarchicalMaterialCategories } from '@/hooks/useHierarchicalMaterialCategories';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleMaterialCategorySelectorProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
}

export const CollapsibleMaterialCategorySelector = ({
  selectedCategoryId,
  onCategoryChange,
  required = false
}: CollapsibleMaterialCategorySelectorProps) => {
  const { organizedCategories, loading, getCategoryDisplay } = useHierarchicalMaterialCategories();
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    );
  };

  const selectedCategory = organizedCategories
    .flatMap(parent => [parent, ...(parent.subcategories || [])])
    .find(cat => cat.id === selectedCategoryId);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="category">
          Category {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="p-3 border rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="category">
        Category {required && <span className="text-destructive">*</span>}
      </Label>
      
      {selectedCategory && (
        <div className="p-3 border rounded-lg bg-muted/10 text-sm">
          <span className="text-muted-foreground">Selected: </span>
          <span className="font-medium">{getCategoryDisplay(selectedCategoryId)}</span>
        </div>
      )}

      <div className="border rounded-lg max-h-[300px] overflow-y-auto">
        {organizedCategories.map((parent) => (
          <div key={parent.id} className="border-b last:border-b-0">
            <Collapsible 
              open={expandedParents.includes(parent.id)}
              onOpenChange={() => toggleParent(parent.id)}
            >
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 justify-start h-auto py-3 px-4 rounded-none",
                    selectedCategoryId === parent.id && "bg-primary/10 text-primary"
                  )}
                  onClick={() => onCategoryChange(parent.id)}
                >
                  {selectedCategoryId === parent.id && (
                    <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  <span className="font-medium text-left flex-1">{parent.name}</span>
                </Button>
                
                {parent.subcategories && parent.subcategories.length > 0 && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-3 rounded-none border-l"
                    >
                      {expandedParents.includes(parent.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>

              {parent.subcategories && parent.subcategories.length > 0 && (
                <CollapsibleContent>
                  <div className="bg-muted/30">
                    {parent.subcategories.map((subcategory) => (
                      <Button
                        key={subcategory.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start h-auto py-2 px-8 rounded-none text-sm",
                          selectedCategoryId === subcategory.id && "bg-primary/10 text-primary"
                        )}
                        onClick={() => onCategoryChange(subcategory.id)}
                      >
                        {selectedCategoryId === subcategory.id && (
                          <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-left flex-1">{subcategory.name}</span>
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          </div>
        ))}
      </div>
    </div>
  );
};