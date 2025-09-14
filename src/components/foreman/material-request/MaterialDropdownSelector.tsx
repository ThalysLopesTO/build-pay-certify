import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMaterialCatalog, MaterialCatalogItem } from '@/hooks/useMaterialCatalog';
import { useHierarchicalMaterialCategories } from '@/hooks/useHierarchicalMaterialCategories';
import { Loader2, Plus } from 'lucide-react';

interface MaterialDropdownSelectorProps {
  value?: string;
  selectedCategory?: string;
  onSelect: (item: MaterialCatalogItem) => void;
  onCustom: () => void;
  showCustomInput?: boolean;
}

export const MaterialDropdownSelector: React.FC<MaterialDropdownSelectorProps> = ({
  value,
  selectedCategory,
  onSelect,
  onCustom,
  showCustomInput = false,
}) => {
  const { getCategoryDisplay } = useHierarchicalMaterialCategories();
  
  // Load all materials for the selected category
  const { data: catalogItems = [], isLoading } = useMaterialCatalog(
    selectedCategory ? '' : undefined,
    selectedCategory || undefined,
    true
  );

  // Group materials by category hierarchy
  const groupedItems = catalogItems.reduce((groups, item) => {
    const categoryDisplay = getCategoryDisplay(item.category || '');
    if (!groups[categoryDisplay]) {
      groups[categoryDisplay] = [];
    }
    groups[categoryDisplay].push(item);
    return groups;
  }, {} as Record<string, MaterialCatalogItem[]>);

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'add-custom') {
      onCustom();
      return;
    }

    const selectedItem = catalogItems.find(item => 
      `${item.name} (${item.unit})` === selectedValue
    );
    
    if (selectedItem) {
      onSelect(selectedItem);
    }
  };

  const getDisplayValue = () => {
    if (!value) return undefined;
    
    const selectedItem = catalogItems.find(item => 
      item.name === value || `${item.name} (${item.unit})` === value
    );
    
    return selectedItem ? `${selectedItem.name} (${selectedItem.unit})` : value;
  };

  return (
    <Select
      value={getDisplayValue()}
      onValueChange={handleValueChange}
      disabled={!selectedCategory}
    >
      <SelectTrigger className="w-full">
        <SelectValue 
          placeholder={
            showCustomInput
              ? "Custom material - enter name below"
              : !selectedCategory 
                ? "Select category first"
                : isLoading 
                  ? "Loading materials..."
                  : "Select material"
          }
        />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading materials...</span>
          </div>
        )}
        
        {!isLoading && selectedCategory && catalogItems.length === 0 && (
          <div className="px-3 py-2 text-center text-muted-foreground text-sm">
            No materials found in this category
          </div>
        )}
        
        {!isLoading && Object.keys(groupedItems).map((category, categoryIndex) => (
          <div key={category}>
            {categoryIndex > 0 && <Separator className="my-1" />}
            
            {Object.keys(groupedItems).length > 1 && (
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {category}
              </div>
            )}
            
            {groupedItems[category].map((item) => (
              <SelectItem 
                key={item.id} 
                value={`${item.name} (${item.unit})`}
                className="flex flex-col items-start py-2"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="secondary" className="text-xs ml-2">
                    {item.unit}
                  </Badge>
                </div>
                {item.sku && (
                  <span className="text-xs text-muted-foreground mt-1">
                    SKU: {item.sku}
                  </span>
                )}
              </SelectItem>
            ))}
          </div>
        ))}
        
        {!isLoading && selectedCategory && (
          <>
            <Separator className="my-1" />
            <SelectItem value="add-custom" className="text-primary">
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Material
              </div>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
};