import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMaterialCatalog, MaterialCatalogItem } from '@/hooks/useMaterialCatalog';
import { useMaterialCategories } from '@/hooks/useMaterialCategories';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialCatalogPickerProps {
  value: string;
  selectedCategory?: string;
  onSelect: (item: MaterialCatalogItem) => void;
  onCustom: (materialName: string) => void;
}

export const MaterialCatalogPicker: React.FC<MaterialCatalogPickerProps> = ({
  value,
  selectedCategory,
  onSelect,
  onCustom,
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load materials filtered by category when dropdown is open
  const { data: catalogItems = [], isLoading } = useMaterialCatalog(
    isOpen ? searchTerm : undefined, 
    selectedCategory || undefined, 
    true
  );
  const { data: categories = [] } = useMaterialCategories();

  // Filter results - show category items on focus, filter on search
  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = searchTerm.length === 0 || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).slice(0, 50);

  // Group items by category, ensuring proper ordering
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  // Sort categories by their defined order
  const sortedCategories = categories
    .filter(cat => groupedItems[cat.name])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(cat => cat.name);

  const hasResults = filteredItems.length > 0;
  const showCustomOption = searchTerm.trim().length > 0 && 
    !filteredItems.some(item => item.name.toLowerCase() === searchTerm.toLowerCase());

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && inputRef.current.contains(event.target as Node)) {
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    updateDropdownPosition();
    setIsOpen(true);
    onCustom(newValue); // Always treat as custom while typing
  };

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleInputFocus = () => {
    updateDropdownPosition();
    setIsOpen(true);
    // Clear search term to show all materials initially
    if (!searchTerm) {
      setSearchTerm('');
    }
  };

  const handleItemSelect = (item: MaterialCatalogItem) => {
    setSearchTerm(item.name);
    setIsOpen(false);
    onSelect(item);
  };

  const handleCustomSelect = () => {
    setIsOpen(false);
    onCustom(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalOptions = filteredItems.length + (showCustomOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex < filteredItems.length) {
          handleItemSelect(filteredItems[highlightedIndex]);
        } else if (showCustomOption) {
          handleCustomSelect();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedCategory ? `Search ${selectedCategory} materials...` : "Select category first"}
          className="pl-9"
          disabled={!selectedCategory}
        />
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[1000] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: '300px'
          }}
        >
          {isLoading && (
            <div className="px-3 py-2 text-center text-muted-foreground">
              Loading materials...
            </div>
          )}
          
          {!selectedCategory && (
            <div className="px-3 py-2 text-center text-muted-foreground">
              Please select a category first to view materials
            </div>
          )}
          
          {selectedCategory && !isLoading && !hasResults && !showCustomOption && (
            <div className="px-3 py-2 text-center text-muted-foreground">
              No materials found in {selectedCategory}
            </div>
          )}
          
          {selectedCategory && !isLoading && !hasResults && searchTerm.trim() !== '' && (
            <div className="px-3 py-2 text-center text-muted-foreground">
              No materials found. Type more to add as custom.
            </div>
          )}
          {selectedCategory && !isLoading && hasResults && (
            <div className="max-h-48 overflow-y-auto">
              {sortedCategories.map((category) => (
                <div key={category}>
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                    {category} ({groupedItems[category]?.length || 0})
                  </div>
                  {groupedItems[category]?.map((item) => {
                    const globalIndex = filteredItems.findIndex(i => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className={cn(
                          "px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                          highlightedIndex === globalIndex && "bg-gray-100 dark:bg-gray-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {item.name} ({item.unit})
                          </div>
                          {item.sku && (
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {item.sku}
                            </code>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {selectedCategory && !isLoading && showCustomOption && (
            <div
              onClick={handleCustomSelect}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700",
                highlightedIndex === filteredItems.length && "bg-gray-100 dark:bg-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Add custom: "{searchTerm}"</div>
                  <div className="text-sm text-muted-foreground">Not in catalog</div>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};