
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';

interface QuotesFiltersProps {
  filters: {
    status: string;
    client_name: string;
    date_from: string;
    date_to: string;
  };
  onFiltersChange: (filters: any) => void;
}

const QuotesFilters: React.FC<QuotesFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: 'all',
      client_name: '',
      date_from: '',
      date_to: '',
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search client name..."
              value={filters.client_name}
              onChange={(e) => handleFilterChange('client_name', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="From date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />

          <Input
            type="date"
            placeholder="To date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />

          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotesFilters;
