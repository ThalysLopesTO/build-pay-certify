import React, { useState, useMemo } from 'react';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { useInventoryPhotos, getInventoryPhotoUrl } from '@/hooks/useInventoryPhotos';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { useIsMobile } from '@/hooks/use-mobile';
import InventoryForm from '../InventoryForm';
import InventoryByJobsite from './InventoryByJobsite';
import UsageTracker from './UsageTracker';
import EquipmentMobileStats from './mobile/EquipmentMobileStats';
import EquipmentMobileFilters from './mobile/EquipmentMobileFilters';
import EquipmentMobileList from './mobile/EquipmentMobileList';
import EquipmentPhotoGallery from './EquipmentPhotoGallery';
import { Button } from '@/components/ui/button';
import { Plus, Package, ClipboardList, Camera, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Separate component for View Equipment content to use hooks
const ViewEquipmentContent: React.FC<{
  item: InventoryItem;
  canManage: boolean;
  onOpenGallery: () => void;
}> = ({ item, canManage, onOpenGallery }) => {
  const { photos, isLoading } = useInventoryPhotos(item.id);

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Equipment Name</p>
          <p className="font-medium">{item.equipment_name}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Brand</p>
          <p className="font-medium">{item.brand}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">SKU</p>
          <p className="font-medium">{item.sku}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Assigned to</p>
          <p className="font-medium">
            {item.jobsites?.name || 'Not assigned'}
          </p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Start Date</p>
          <p className="font-medium">
            {format(new Date(item.start_date), 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Return Date</p>
          <p className="font-medium">
            {item.return_date 
              ? format(new Date(item.return_date), 'MMM dd, yyyy')
              : 'Not set'
            }
          </p>
        </div>
      </div>

      {/* Photos Section */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photos ({photos.length})
          </p>
          <Button variant="outline" size="sm" onClick={onOpenGallery}>
            {canManage ? 'Manage Photos' : 'View All'}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.slice(0, 4).map((photo) => (
              <img
                key={photo.id}
                src={getInventoryPhotoUrl(photo.file_path)}
                alt={photo.file_name}
                className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onOpenGallery}
              />
            ))}
            {photos.length > 4 && (
              <div 
                className="h-16 w-16 rounded border bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80"
                onClick={onOpenGallery}
              >
                <span className="text-sm text-muted-foreground">+{photos.length - 4}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <ImageIcon className="h-4 w-4" />
            <span>No photos yet</span>
          </div>
        )}
      </div>
    </div>
  );
};

const EquipmentManagement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('equipment');
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
    isReturning,
    refetch
  } = useInventory();
  const { data: jobsites = [] } = useActiveJobsites();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [returningItem, setReturningItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  
  // Mobile filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

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

  // Filter and group inventory for mobile
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = 
        item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const itemStatus = getEquipmentStatus(item);
      const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
      
      const matchesJobsite = jobsiteFilter === 'all' || 
        (jobsiteFilter === 'unassigned' && !item.jobsite_id) ||
        item.jobsite_id === jobsiteFilter;
      
      let matchesDateRange = true;
      if (dateRange.from) {
        const startDate = new Date(item.start_date);
        matchesDateRange = startDate >= dateRange.from;
        if (dateRange.to) {
          matchesDateRange = matchesDateRange && startDate <= dateRange.to;
        }
      }
      
      return matchesSearch && matchesStatus && matchesJobsite && matchesDateRange;
    });
  }, [inventory, searchTerm, statusFilter, jobsiteFilter, dateRange]);

  const groupedInventory = useMemo(() => {
    const groups: Record<string, { jobsite: any; equipment: InventoryItem[] }> = {};
    
    groups['unassigned'] = { jobsite: null, equipment: [] };
    
    jobsites.forEach((jobsite) => {
      groups[jobsite.id] = { jobsite, equipment: [] };
    });
    
    filteredInventory.forEach((item) => {
      const key = item.jobsite_id || 'unassigned';
      if (groups[key]) {
        groups[key].equipment.push(item);
      }
    });
    
    return Object.entries(groups)
      .filter(([_, group]) => group.equipment.length > 0)
      .map(([key, group]) => [
        key,
        {
          jobsiteName: group.jobsite?.name || 'Unassigned Equipment',
          jobsiteId: group.jobsite?.id || null,
          equipment: group.equipment,
        },
      ]) as Array<[string, { jobsiteName: string; jobsiteId: string | null; equipment: InventoryItem[] }]>;
  }, [filteredInventory, jobsites]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = inventory.length;
    const assigned = inventory.filter(item => {
      const status = getEquipmentStatus(item);
      return status === 'assigned';
    }).length;
    const available = inventory.filter(item => getEquipmentStatus(item) === 'available').length;
    const overdue = inventory.filter(item => getEquipmentStatus(item) === 'overdue').length;
    
    return { total, assigned, available, overdue };
  }, [inventory]);

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
  
  const handleSetAsReturned = async () => {
    if (returningItem) {
      await setAsReturned(returningItem.id);
      setReturningItem(null);
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setJobsiteFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-lg">
          <TabsTrigger 
            value="equipment" 
            className={cn(
              "flex items-center space-x-2 rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm"
            )}
          >
            <Package className="h-4 w-4" />
            <span>Equipment</span>
          </TabsTrigger>
          <TabsTrigger 
            value="usage" 
            className={cn(
              "flex items-center space-x-2 rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm"
            )}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Usage Tracker</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-6 space-y-6">
          {/* Desktop View */}
          {!isMobile && (
            <InventoryByJobsite
              onAddEquipment={() => setIsFormOpen(true)}
              onEditItem={handleEditItem}
              onDeleteItem={setDeletingItem}
              onViewItem={setViewingItem}
              onReturnItem={setReturningItem}
              isReturning={isReturning}
            />
          )}

          {/* Mobile View */}
          {isMobile && (
            <>
              <EquipmentMobileStats
                total={stats.total}
                assigned={stats.assigned}
                available={stats.available}
                overdue={stats.overdue}
              />
              
              <EquipmentMobileFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                jobsiteFilter={jobsiteFilter}
                onJobsiteChange={setJobsiteFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                jobsites={jobsites}
                onClearFilters={resetFilters}
              />
              
              <EquipmentMobileList
                groupedEquipment={groupedInventory}
                getEquipmentStatus={getEquipmentStatus}
                canManageInventory={canManageInventory}
                onEdit={handleEditItem}
                onDelete={setDeletingItem}
                onView={setViewingItem}
                onReturn={setReturningItem}
                isReturning={isReturning}
                onRefresh={handleRefresh}
                isLoading={isLoading}
              />

              {/* Floating Action Button */}
              {canManageInventory && (
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
                  size="icon"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <UsageTracker />
        </TabsContent>
      </Tabs>

      {/* Inventory Form Modal */}
      <InventoryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        initialData={editingItem}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.equipment_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return Confirmation Dialog */}
      <AlertDialog open={!!returningItem} onOpenChange={(open) => !open && setReturningItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Mark "{returningItem?.equipment_name}" as returned to inventory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetAsReturned}>
              {isReturning ? 'Returning...' : 'Mark as Returned'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Equipment Sheet */}
      <Sheet open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Equipment Details</SheetTitle>
            <SheetDescription>
              View detailed information about this equipment
            </SheetDescription>
          </SheetHeader>
          
          {viewingItem && (
            <ViewEquipmentContent 
              item={viewingItem} 
              canManage={canManageInventory}
              onOpenGallery={() => setShowPhotoGallery(true)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Photo Gallery for View Sheet */}
      {viewingItem && (
        <EquipmentPhotoGallery
          isOpen={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
          inventoryId={viewingItem.id}
          equipmentName={viewingItem.equipment_name}
          canManage={canManageInventory}
        />
      )}
    </div>
  );
};

export default EquipmentManagement;