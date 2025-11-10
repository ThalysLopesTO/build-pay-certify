import React from 'react';
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
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client name..."
            value={filters.client_name}
            onChange={(e) => handleFilterChange('client_name', e.target.value)}
            className="pl-10 h-10 rounded-lg border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[180px] h-10 rounded-lg border-slate-200 dark:border-slate-700">
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
          className="w-[160px] h-10 rounded-lg border-slate-200 dark:border-slate-700"
        />

        <Input
          type="date"
          placeholder="To date"
          value={filters.date_to}
          onChange={(e) => handleFilterChange('date_to', e.target.value)}
          className="w-[160px] h-10 rounded-lg border-slate-200 dark:border-slate-700"
        />

        <Button 
          variant="ghost" 
          onClick={handleClearFilters}
          className="h-10 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default QuotesFilters;
