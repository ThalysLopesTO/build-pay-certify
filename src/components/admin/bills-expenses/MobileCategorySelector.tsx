import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useHierarchicalCategories } from '@/hooks/useHierarchicalCategories';

interface MobileCategorySelectorProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  required?: boolean;
  transactionType?: 'income' | 'expense';
}

export const MobileCategorySelector = ({
  selectedCategoryId,
  onCategoryChange,
  required = false,
  transactionType = 'expense'
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

  return (
    <div>
      <Label>
        Category {required && <span className="text-destructive">*</span>}
      </Label>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-11"
          >
            <span className={!selectedCategoryId ? "text-muted-foreground" : ""}>
              {displayValue}
            </span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Select Category</DrawerTitle>
          </DrawerHeader>
          
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
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
