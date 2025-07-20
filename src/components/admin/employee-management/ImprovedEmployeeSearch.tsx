import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImprovedEmployeeSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ImprovedEmployeeSearch: React.FC<ImprovedEmployeeSearchProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="bg-card rounded-xl shadow-sm border p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees by name, trade, position, or role..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 bg-background"
          />
        </div>
        <Button variant="outline" className="h-11 px-4">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
    </div>
  );
};

export default ImprovedEmployeeSearch;