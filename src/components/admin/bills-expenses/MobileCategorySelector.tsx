import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';

interface MobileCategorySelectorProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
  transactionType?: 'income' | 'expense';
  insideModal?: boolean;
}

export const MobileCategorySelector = ({
  selectedCategoryId,
  onCategoryChange,
  required = false,
  transactionType = 'expense',
  insideModal = false
}: MobileCategorySelectorProps) => {
  const { getParentCategories, getSubcategoriesForParent, getCategoryDisplay } = useHierarchicalCategories();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const parentCategories = getParentCategories(transactionType);
  
  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return parentCategories;
    
    const query = searchQuery.toLowerCase();
    return parentCategories.filter(parent => {
      const parentMatch = parent.name.toLowerCase().includes(query);
      const subcategories = getSubcategoriesForParent(parent.id);
      const subcategoryMatch = subcategories.some(sub => 
        sub.name.toLowerCase().includes(query)
      );
      return parentMatch || subcategoryMatch;
    });
  }, [parentCategories, searchQuery, getSubcategoriesForParent]);

  const handleSelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setOpen(false);
    setSearchQuery('');
  };

  const displayValue = selectedCategoryId 
    ? getCategoryDisplay(selectedCategoryId) 
    : 'Select category';

  // Create a flat list of all categories for the simple Select
  const allCategoryOptions = useMemo(() => {
    const options: Array<{ id: string; displayName: string }> = [];
    
    parentCategories.forEach(parent => {
      const subcategories = getSubcategoriesForParent(parent.id);
      if (subcategories.length > 0) {
        // Add subcategories with parent prefix
        subcategories.forEach(subcategory => {
          options.push({
            id: subcategory.id,
            displayName: `${parent.name} > ${subcategory.name}`
          });
        });
      } else {
        // Add parent category if no subcategories
        options.push({
          id: parent.id,
          displayName: parent.name
        });
      }
    });
    
    return options;
  }, [parentCategories, getSubcategoriesForParent]);

  // When inside a modal, use a simple Select to avoid nested dialog issues
  if (insideModal) {
    return (
      <div>
        <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50 max-h-[300px] overflow-auto">
            {allCategoryOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Use Dialog instead of Drawer to avoid iOS PWA issues with vaul
  return (
    <div>
      <Label>
        Category {required && <span className="text-destructive">*</span>}
      </Label>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-left font-normal h-11"
      >
        <span className={!selectedCategoryId ? "text-muted-foreground" : ""}>
          {displayValue}
        </span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-[95vw] max-w-md p-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Select Category</DialogTitle>
          </DialogHeader>
          
          <div className="px-4 pb-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-[50vh]">
              <div className="space-y-1 pr-4">
                {filteredCategories.map((parent) => {
                  const subcategories = getSubcategoriesForParent(parent.id);
                  const hasSubcategories = subcategories.length > 0;
                  
                  return (
                    <div key={parent.id} className="mb-4">
                      {/* Parent Category */}
                      {hasSubcategories ? (
                        <div className="font-semibold text-sm text-foreground px-3 py-2 bg-muted/50 rounded-md mb-1">
                          {parent.name}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelect(parent.id)}
                          className={`w-full text-left px-3 py-3 rounded-md transition-colors hover:bg-accent ${
                            selectedCategoryId === parent.id ? 'bg-accent' : ''
                          }`}
                        >
                          <span className="font-medium">{parent.name}</span>
                        </button>
                      )}
                      
                      {/* Subcategories */}
                      {hasSubcategories && (
                        <div className="space-y-1 ml-2">
                          {subcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              onClick={() => handleSelect(subcategory.id)}
                              className={`w-full text-left px-3 py-3 rounded-md transition-colors hover:bg-accent ${
                                selectedCategoryId === subcategory.id ? 'bg-accent' : ''
                              }`}
                            >
                              <span className="text-muted-foreground">
                                {subcategory.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No categories found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="px-4 pb-4 border-t pt-4">
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
