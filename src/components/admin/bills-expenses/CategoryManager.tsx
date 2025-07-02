import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';

interface ExpenseCategory {
  id: string;
  name: string;
}

interface CategoryManagerProps {
  categories: ExpenseCategory[];
  onCategoriesChange: () => void;
}

export const CategoryManager = ({ categories, onCategoriesChange }: CategoryManagerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('expense_categories')
        .insert({
          company_id: user?.companyId,
          name: newCategoryName.trim(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      setNewCategoryName('');
      onCategoriesChange();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editName.trim()) return;

    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ name: editName.trim() })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      setEditingCategory(null);
      setEditName('');
      onCategoriesChange();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;

    try {
      // Check if category is being used
      const { data: expensesUsingCategory, error: checkError } = await supabase
        .from('bills_expenses')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1);

      if (checkError) throw checkError;

      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This category is being used by existing expenses and cannot be deleted.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      onCategoriesChange();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const startEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Expense Categories</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Category */}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Label htmlFor="new-category">Add New Category</Label>
              <Input
                id="new-category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Categories Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {editingCategory?.id === category.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                          />
                          <Button size="sm" onClick={handleEditCategory}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        category.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCategory?.id !== category.id && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};