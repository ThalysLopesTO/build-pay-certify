import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PhoneMobileFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  onManageCategories: () => void;
  categoryCounts: Record<string, number>;
}

const PhoneMobileFilters: React.FC<PhoneMobileFiltersProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  onManageCategories,
  categoryCounts,
}) => {
  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search name, phone, or extension..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category Chips with Counts */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Badge
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          className={`cursor-pointer whitespace-nowrap transition-colors ${
            categoryFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
          }`}
          onClick={() => onCategoryChange('all')}
        >
          All
          {Object.values(categoryCounts).length > 0 && (
            <span className="ml-1 opacity-70">
              ({Object.values(categoryCounts).reduce((a, b) => a + b, 0)})
            </span>
          )}
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category}
            variant={categoryFilter === category ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap transition-colors ${
              categoryFilter === category
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
            {categoryCounts[category] && (
              <span className="ml-1 opacity-70">
                ({categoryCounts[category]})
              </span>
            )}
          </Badge>
        ))}
      </div>

      {/* Manage Categories Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onManageCategories}
        className="w-full"
      >
        <Settings className="h-4 w-4 mr-2" />
        Manage Categories
      </Button>
    </div>
  );
};

export default PhoneMobileFilters;
