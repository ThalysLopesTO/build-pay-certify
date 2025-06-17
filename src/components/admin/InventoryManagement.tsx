
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { useJobsites } from '@/hooks/useJobsites';
import InventoryForm from './InventoryForm';

const InventoryManagement = () => {
  const { user } = useAuth();
  const { inventory, isLoading, createItem, updateItem, deleteItem, isCreating, isUpdating, isDeleting } = useInventory();
  const { data: jobsites = [] } = useJobsites();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobsiteFilter, setJobsiteFilter] = useState<string>('all');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Filter inventory based on search term and jobsite
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobsite = jobsiteFilter === 'all' || item.jobsite_id === jobsiteFilter;
    
    return matchesSearch && matchesJobsite;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Inventory Management</CardTitle>
              <CardDescription>
                Manage equipment inventory across all jobsites
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsFormOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search equipment, brand, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by jobsite" />
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
          </div>

          {/* Inventory Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Jobsite</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || jobsiteFilter !== 'all' 
                        ? 'No inventory items match your filters'
                        : 'No inventory items found. Add some equipment to get started.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.equipment_name}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.jobsites?.name || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(item.start_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {item.return_date ? format(new Date(item.return_date), 'MMM dd, yyyy') : 'Not returned'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              disabled={isUpdating}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingItem(item)}
                              disabled={isDeleting}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
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
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.equipment_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryManagement;
