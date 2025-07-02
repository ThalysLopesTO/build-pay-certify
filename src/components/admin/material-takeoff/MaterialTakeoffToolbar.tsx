import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Upload, 
  Download, 
  FileText, 
  Trash2, 
  Edit3,
  Search,
  Filter
} from 'lucide-react';

interface MaterialTakeoffToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedJobsite: string;
  onJobsiteChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedItems: string[];
  onAddNew: () => void;
  onImport: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  jobsites: Array<{ id: string; name: string }>;
  categories: string[];
  isLoading?: boolean;
}

const MaterialTakeoffToolbar: React.FC<MaterialTakeoffToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedJobsite,
  onJobsiteChange,
  selectedCategory,
  onCategoryChange,
  selectedItems,
  onAddNew,
  onImport,
  onExportExcel,
  onExportPDF,
  onBulkEdit,
  onBulkDelete,
  jobsites,
  categories,
  isLoading,
}) => {
  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={onAddNew} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
          <Button variant="outline" onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={onExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <Button variant="outline" size="sm" onClick={onBulkEdit}>
            <Edit3 className="h-4 w-4 mr-1" />
            Bulk Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedJobsite} onValueChange={onJobsiteChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Jobsites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobsites</SelectItem>
            {jobsites.map((jobsite) => (
              <SelectItem key={jobsite.id} value={jobsite.id}>
                {jobsite.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={() => {
            onSearchChange('');
            onJobsiteChange('all');
            onCategoryChange('all');
          }}
          className="w-full"
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default MaterialTakeoffToolbar;