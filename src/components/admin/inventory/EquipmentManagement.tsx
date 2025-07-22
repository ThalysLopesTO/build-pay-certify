import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CalendarRange, 
  MapPin, 
  Tag, 
  Info,
  Eye,
  Package,
  ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { useJobsites } from '@/hooks/useJobsites';
import InventoryForm from '../InventoryForm';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const EquipmentManagement = () => {
  const { user } = useAuth();
  const { 
    inventory, 
    isLoading, 
    createItem, 
    updateItem, 
    deleteItem, 
    setAsReturned,
    isCreating, 
    isUpdating, 
    isDeleting,
    isReturning 
  } = useInventory();
  const { data: jobsites = [] } = useJobsites();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [returningItem, setReturningItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

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

  // Filter inventory based on all filters
  const filteredInventory = inventory.filter((item) => {
    // Search filter
    const matchesSearch = 
      item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Jobsite filter
    const matchesJobsite = jobsiteFilter === 'all' || item.jobsite_id === jobsiteFilter;
    
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
    
    return matchesSearch && matchesJobsite && matchesStatus && matchesDateRange;
  });

  const handleCreateItem = async (data: any) => {
    await createItem(data);
    setIsFormOpen(false);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleUpdateItem = async (data: any) => {
    if (editingItem) {
      await updateItem({ id: editingItem.id, updates: data });
      setEditingItem(null);
      setIsFormOpen(false);
    }
  };

  const handleDeleteItem = async () => {
    if (deletingItem) {
      await deleteItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
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
  
  const handleSetAsReturned = async () => {
    if (returningItem) {
      await setAsReturned(returningItem.id);
      setReturningItem(null);
    }
  };
  
  // Calculate summary stats
  const totalEquipment = inventory.length;
  const assignedEquipment = inventory.filter(item => item.status === 'assigned' || 
    (!item.status && item.jobsite_id && !item.return_date)).length;
  const returnedEquipment = inventory.filter(item => item.status === 'returned' || 
    (!item.status && item.return_date)).length;
  const availableEquipment = inventory.filter(item => item.status === 'available' || 
    (!item.status && !item.jobsite_id)).length;

  const resetFilters = () => {
    setSearchTerm('');
    setJobsiteFilter('all');
    setStatusFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

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
      
      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Filters and Search */}
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
              
              <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                <SelectTrigger className="w-[160px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Jobsite" />
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
            
            {(searchTerm || jobsiteFilter !== 'all' || statusFilter !== 'all' || dateRange.from) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
                Clear Filters
              </Button>
            )}
            
            {isAdmin && (
              <Button onClick={() => setIsFormOpen(true)} className="ml-auto bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            )}
          </div>

          {/* Inventory Table */}
          <div className="rounded-lg overflow-hidden border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Equipment Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jobsite</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || jobsiteFilter !== 'all' || statusFilter !== 'all' || dateRange.from
                        ? 'No equipment items match your filters'
                        : 'No equipment items found. Add some equipment to get started.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item, index) => {
                    const status = getEquipmentStatus(item);
                    return (
                      <TableRow key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <TableCell className="font-medium">{item.equipment_name}</TableCell>
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell>
                          {item.jobsites?.name || (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(item.start_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {item.return_date 
                            ? format(new Date(item.return_date), 'MMM dd, yyyy')
                            : <span className="text-muted-foreground text-sm">Not set</span>
                          }
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 transition-all hover:scale-110"
                                      onClick={() => setViewingItem(item)}
                                    >
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {/* Set as Returned button - only show if not already returned */}
                              {!item.return_date && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 transition-all hover:scale-110"
                                        onClick={() => setReturningItem(item)}
                                        disabled={isReturning}
                                      >
                                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Set as Returned</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 transition-all hover:scale-110"
                                      onClick={() => handleEditItem(item)}
                                      disabled={isUpdating}
                                    >
                                      <Edit className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Equipment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 transition-all hover:scale-110 text-destructive hover:text-destructive"
                                      onClick={() => setDeletingItem(item)}
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete Equipment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <InventoryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        initialData={editingItem}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.equipment_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return Confirmation Dialog */}
      <AlertDialog open={!!returningItem} onOpenChange={() => setReturningItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Returned</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{returningItem?.equipment_name}" as returned? The current date will be set as the return date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSetAsReturned}
              disabled={isReturning}
            >
              {isReturning ? 'Processing...' : 'Confirm Return'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Details Sheet */}
      <Sheet open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Equipment Details
            </SheetTitle>
            <SheetDescription>
              Detailed information about this equipment item.
            </SheetDescription>
          </SheetHeader>
          
          {viewingItem && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                <div className="font-medium text-muted-foreground">Name:</div>
                <div className="font-semibold">{viewingItem.equipment_name}</div>
                
                <div className="font-medium text-muted-foreground">Brand:</div>
                <div>{viewingItem.brand}</div>
                
                <div className="font-medium text-muted-foreground">SKU:</div>
                <div>{viewingItem.sku}</div>
                
                <div className="font-medium text-muted-foreground">Status:</div>
                <div>{getStatusBadge(getEquipmentStatus(viewingItem))}</div>
                
                <div className="font-medium text-muted-foreground">Jobsite:</div>
                <div>{viewingItem.jobsites?.name || 'Unassigned'}</div>
                
                <div className="font-medium text-muted-foreground">Jobsite Address:</div>
                <div>{viewingItem.jobsites?.address || 'N/A'}</div>
                
                <div className="font-medium text-muted-foreground">Start Date:</div>
                <div>{format(new Date(viewingItem.start_date), 'MMMM dd, yyyy')}</div>
                
                <div className="font-medium text-muted-foreground">Return Date:</div>
                <div>
                  {viewingItem.return_date 
                    ? format(new Date(viewingItem.return_date), 'MMMM dd, yyyy')
                    : 'Not set'
                  }
                </div>
                
                <div className="font-medium text-muted-foreground">Added On:</div>
                <div>{format(new Date(viewingItem.created_at), 'MMMM dd, yyyy')}</div>
              </div>
              
              <div className="pt-4 flex justify-between">
                {isAdmin && (
                  <Button onClick={() => {
                    setViewingItem(null);
                    handleEditItem(viewingItem);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Equipment
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewingItem(null)}>Close</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EquipmentManagement;