import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  CalendarRange, 
  Tag 
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { useActiveJobsites } from '@/hooks/useJobsites';
import JobsiteInventoryCard from './JobsiteInventoryCard';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface InventoryByJobsiteProps {
  onAddEquipment: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onViewItem: (item: InventoryItem) => void;
  onReturnItem: (item: InventoryItem) => void;
  isReturning: boolean;
}

const InventoryByJobsite: React.FC<InventoryByJobsiteProps> = ({
  onAddEquipment,
  onEditItem,
  onDeleteItem,
  onViewItem,
  onReturnItem,
  isReturning
}) => {
  const { user } = useAuth();
  const { inventory, isLoading } = useInventory();
  const { data: jobsites = [] } = useActiveJobsites();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const canManageInventory = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'foreman' || user?.role === 'management';

  // Get equipment status
  const getEquipmentStatus = (item: InventoryItem) => {
    if (!item.jobsite_id) return 'available';
    
    const now = new Date();
    const returnDate = item.return_date ? new Date(item.return_date) : null;
    
    if (returnDate && returnDate < now) {
      return 'overdue';
    }
    
    return 'assigned';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string, label: string }> = {
      'available': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Available' },
      'assigned': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Assigned' },
      'overdue': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Overdue' },
      'returned': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Returned' },
      'maintenance': { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Maintenance' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };
    
    return (
      <Badge variant="outline" className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  // Filter inventory based on search and status
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Search filter
      const matchesSearch = 
        item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const itemStatus = getEquipmentStatus(item);
      const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.from) {
        const startDate = new Date(item.start_date);
        matchesDateRange = startDate >= dateRange.from;
        
        if (dateRange.to) {
          matchesDateRange = matchesDateRange && startDate <= dateRange.to;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [inventory, searchTerm, statusFilter, dateRange]);

  // Group equipment by jobsite
  const groupedInventory = useMemo(() => {
    const groups: Record<string, { jobsite: any; equipment: InventoryItem[] }> = {};
    
    // Add unassigned group
    groups['unassigned'] = {
      jobsite: null,
      equipment: []
    };
    
    // Initialize groups for all jobsites
    jobsites.forEach((jobsite) => {
      groups[jobsite.id] = {
        jobsite,
        equipment: []
      };
    });
    
    // Group filtered inventory
    filteredInventory.forEach((item) => {
      const key = item.jobsite_id || 'unassigned';
      if (groups[key]) {
        groups[key].equipment.push(item);
      }
    });
    
    // Filter out empty groups and sort
    return Object.entries(groups)
      .filter(([_, group]) => group.equipment.length > 0)
      .sort(([keyA, groupA], [keyB, groupB]) => {
        // Unassigned group first
        if (keyA === 'unassigned') return -1;
        if (keyB === 'unassigned') return 1;
        
        // Then sort by jobsite name
        const nameA = groupA.jobsite?.name || '';
        const nameB = groupB.jobsite?.name || '';
        return nameA.localeCompare(nameB);
      });
  }, [filteredInventory, jobsites]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  // Calculate summary stats
  const totalEquipment = inventory.length;
  const assignedEquipment = inventory.filter(item => item.status === 'assigned' || 
    (!item.status && item.jobsite_id && !item.return_date)).length;
  const returnedEquipment = inventory.filter(item => item.status === 'returned' || 
    (!item.status && item.return_date)).length;
  const availableEquipment = inventory.filter(item => item.status === 'available' || 
    (!item.status && !item.jobsite_id)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col justify-between">
            <div className="text-sm text-muted-foreground">Total Equipment</div>
            <div className="text-3xl font-bold mt-2">{totalEquipment}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col justify-between">
            <div className="text-sm text-muted-foreground">Assigned</div>
            <div className="text-3xl font-bold mt-2 text-blue-600">{assignedEquipment}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col justify-between">
            <div className="text-sm text-muted-foreground">Available</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{availableEquipment}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col justify-between">
            <div className="text-sm text-muted-foreground">Returned</div>
            <div className="text-3xl font-bold mt-2 text-gray-600">{returnedEquipment}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search equipment, brand, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>Date: {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}</>
                      ) : (
                        <>Date: {format(dateRange.from, "MMM d")}</>
                      )
                    ) : (
                      <span>Date Range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={(range) => {
                      if (range) {
                        setDateRange({
                          from: range.from,
                          to: range.to
                        });
                      } else {
                        setDateRange({
                          from: undefined,
                          to: undefined
                        });
                      }
                    }}
                    className="p-3 pointer-events-auto"
                    numberOfMonths={2}
                  />
                  <div className="flex items-center justify-between p-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>Clear</Button>
                    <Button size="sm">Apply</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {(searchTerm || statusFilter !== 'all' || dateRange.from) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
                Clear Filters
              </Button>
            )}
            
            {canManageInventory && (
              <Button onClick={onAddEquipment} className="ml-auto bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobsite Equipment Cards */}
      <div className="space-y-4">
        {groupedInventory.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateRange.from
                ? 'No equipment items match your filters'
                : 'No equipment items found. Add some equipment to get started.'
              }
            </CardContent>
          </Card>
        ) : (
          groupedInventory.map(([key, group]) => (
            <JobsiteInventoryCard
              key={key}
              jobsiteName={group.jobsite?.name || 'Unassigned Equipment'}
              jobsiteId={group.jobsite?.id || null}
              equipment={group.equipment}
              canManageInventory={canManageInventory}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onViewItem={onViewItem}
              onReturnItem={onReturnItem}
              getStatusBadge={getStatusBadge}
              getEquipmentStatus={getEquipmentStatus}
              isReturning={isReturning}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryByJobsite;