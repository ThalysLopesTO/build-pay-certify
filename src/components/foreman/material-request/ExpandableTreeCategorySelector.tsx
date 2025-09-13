import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHierarchicalMaterialCategories } from '@/hooks/useHierarchicalMaterialCategories';
import { cn } from '@/lib/utils';

interface ExpandableTreeCategorySelectorProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
}

export const ExpandableTreeCategorySelector = ({
  selectedCategoryId,
  onCategoryChange,
  required = false
}: ExpandableTreeCategorySelectorProps) => {
  const { organizedCategories, loading, getCategoryDisplay } = useHierarchicalMaterialCategories();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div>
        <Label htmlFor="category">
          Category {required && <span className="text-destructive">*</span>}
        </Label>
        <Button variant="outline" disabled className="w-full justify-start">
          Loading categories...
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="category">
        Category {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-start"
          >
            {selectedCategoryId 
              ? getCategoryDisplay(selectedCategoryId) 
              : "Select category"
            }
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-background border border-border shadow-lg" align="start">
          <div className="max-h-[300px] overflow-y-auto">
            {organizedCategories.map((parent) => (
              <div key={parent.id}>
                {parent.subcategories && parent.subcategories.length > 0 ? (
                  <>
                    {/* Parent category with expand/collapse */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 h-auto font-medium hover:bg-muted"
                      onClick={() => toggleExpanded(parent.id)}
                    >
                      {expandedCategories.has(parent.id) ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      {parent.name}
                    </Button>
                    
                    {/* Subcategories (only show when expanded) */}
                    {expandedCategories.has(parent.id) && (
                      <div className="border-l border-border ml-6">
                        {parent.subcategories.map((subcategory) => (
                          <Button
                            key={subcategory.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start px-4 py-2 h-auto text-sm pl-6 hover:bg-muted",
                              selectedCategoryId === subcategory.id && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => handleCategorySelect(subcategory.id)}
                          >
                            -- {subcategory.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Standalone parent category (selectable) */
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-2 h-auto hover:bg-muted",
                      selectedCategoryId === parent.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleCategorySelect(parent.id)}
                  >
                    {parent.name}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};