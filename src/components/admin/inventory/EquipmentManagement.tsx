import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import InventoryForm from '../InventoryForm';
import InventoryByJobsite from './InventoryByJobsite';

const EquipmentManagement = () => {
  const { user } = useAuth();
  const { 
    createItem, 
    updateItem, 
    deleteItem, 
    setAsReturned,
    isCreating, 
    isUpdating, 
    isDeleting,
    isReturning 
  } = useInventory();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [returningItem, setReturningItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  const canManageInventory = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'foreman' || user?.role === 'management';

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

  return (
    <div className="space-y-6">
      <InventoryByJobsite
        onAddEquipment={() => setIsFormOpen(true)}
        onEditItem={handleEditItem}
        onDeleteItem={setDeletingItem}
        onViewItem={setViewingItem}
        onReturnItem={setReturningItem}
        isReturning={isReturning}
      />

      {/* Inventory Form Modal */}
      {isFormOpen && (
        <InventoryForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          initialData={editingItem}
          isSubmitting={editingItem ? isUpdating : isCreating}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.equipment_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return Equipment Confirmation Dialog */}
      <AlertDialog open={!!returningItem} onOpenChange={(open) => !open && setReturningItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Equipment as Returned</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{returningItem?.equipment_name}" as returned? 
              This will remove it from the current jobsite assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReturning}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSetAsReturned} 
              disabled={isReturning}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isReturning ? "Setting as Returned..." : "Set as Returned"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Equipment Details Sheet */}
      <Sheet open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Equipment Details</SheetTitle>
            <SheetDescription>
              View detailed information about this equipment item.
            </SheetDescription>
          </SheetHeader>
          
          {viewingItem && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Equipment Name</label>
                  <p className="text-lg font-semibold">{viewingItem.equipment_name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Brand</label>
                    <p className="font-medium">{viewingItem.brand}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="font-medium">{viewingItem.sku}</p>
                  </div>
                </div>
                
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Jobsite</label>
                  <p className="font-medium">
                    {viewingItem.jobsites?.name || 'Unassigned'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="font-medium">{format(new Date(viewingItem.start_date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Return Date</label>
                    <p className="font-medium">
                      {viewingItem.return_date 
                        ? format(new Date(viewingItem.return_date), 'MMM dd, yyyy')
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EquipmentManagement;