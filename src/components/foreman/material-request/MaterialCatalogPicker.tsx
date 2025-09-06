import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMaterialCatalog, MaterialCatalogItem } from '@/hooks/useMaterialCatalog';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialCatalogPickerProps {
  value: string;
  onSelect: (item: MaterialCatalogItem) => void;
  onCustom: (materialName: string) => void;
}

export const MaterialCatalogPicker: React.FC<MaterialCatalogPickerProps> = ({
  value,
  onSelect,
  onCustom,
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: catalogItems = [], isLoading } = useMaterialCatalog(searchTerm, undefined, true);

  // Filter results based on search term with debouncing
  const filteredItems = catalogItems.filter(item =>
    searchTerm.trim() === '' || // Show all if no search term
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.spec_size && item.spec_size.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 10); // Limit to 10 results

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
          placeholder="Search materials or type custom..."
          className="pl-9"
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
          
          {!isLoading && !hasResults && !showCustomOption && searchTerm.trim() === '' && (
            <div className="px-3 py-2 text-center text-muted-foreground">
              Start typing to search materials...
            </div>
          )}
          
          {!isLoading && !hasResults && !showCustomOption && searchTerm.trim() !== '' && (
            <div className="px-3 py-2 text-center text-muted-foreground">
              No materials found. Type more to add as custom.
            </div>
          )}
          {!isLoading && filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                highlightedIndex === index && "bg-gray-100 dark:bg-gray-700"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  {item.spec_size && (
                    <div className="text-sm text-muted-foreground">{item.spec_size}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                </div>
              </div>
              {item.sku && (
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  SKU: {item.sku}
                </div>
              )}
            </div>
          ))}

          {!isLoading && showCustomOption && (
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