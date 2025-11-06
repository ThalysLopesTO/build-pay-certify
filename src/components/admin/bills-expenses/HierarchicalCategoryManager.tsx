import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Settings, Plus, Edit, Trash2, ChevronRight, ChevronDown, FolderPlus } from 'lucide-react';

interface HierarchicalCategory {
  id: string;
  name: string;
  category_level: 'parent' | 'subcategory';
  parent_category_id?: string;
  sort_order: number;
  subcategories?: HierarchicalCategory[];
}

interface HierarchicalCategoryManagerProps {
  categories: HierarchicalCategory[];
  onCategoriesChange: () => void;
  trigger?: React.ReactNode;
}

export const HierarchicalCategoryManager = ({ categories, onCategoriesChange, trigger }: HierarchicalCategoryManagerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentForSubcategory, setSelectedParentForSubcategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<HierarchicalCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  
  // Organize categories into parent-child hierarchy
  const organizedCategories = React.useMemo(() => {
    const parents = categories.filter(cat => cat.category_level === 'parent');
    return parents.map(parent => ({
      ...parent,
      subcategories: categories.filter(cat => cat.parent_category_id === parent.id)
    })).sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  const parentCategories = organizedCategories;

  const handleAddParentCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('expense_categories')
        .insert({
          company_id: user?.companyId,
          name: newCategoryName.trim(),
          category_level: 'parent',
          sort_order: parentCategories.length,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Parent category added successfully",
      });

      setNewCategoryName('');
      onCategoriesChange();
    } catch (error) {
      console.error('Error adding parent category:', error);
      toast({
        title: "Error",
        description: "Failed to add parent category",
        variant: "destructive",
      });
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedParentForSubcategory) return;

    try {
      const parentCategory = parentCategories.find(p => p.id === selectedParentForSubcategory);
      const subcategoryCount = parentCategory?.subcategories?.length || 0;

      const { error } = await supabase
        .from('expense_categories')
        .insert({
          company_id: user?.companyId,
          name: newSubcategoryName.trim(),
          category_level: 'subcategory',
          parent_category_id: selectedParentForSubcategory,
          sort_order: subcategoryCount,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcategory added successfully",
      });

      setNewSubcategoryName('');
      setSelectedParentForSubcategory('');
      onCategoriesChange();
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast({
        title: "Error",
        description: "Failed to add subcategory",
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

  const handleDeleteCategory = async (category: HierarchicalCategory) => {
    const isParent = category.category_level === 'parent';
    const hasSubcategories = isParent && category.subcategories && category.subcategories.length > 0;
    
    // Check if category or its subcategories are being used
    try {
      let categoryIds = [category.id];
      if (hasSubcategories) {
        categoryIds = [...categoryIds, ...category.subcategories!.map(sub => sub.id)];
      }

      const { data: expensesUsingCategory, error: checkError } = await supabase
        .from('bills_expenses')
        .select('id')
        .in('category_id', categoryIds)
        .limit(1);

      if (checkError) throw checkError;

      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        toast({
          title: "Cannot Delete",
          description: `This ${isParent ? 'parent category' : 'subcategory'} is being used by existing expenses and cannot be deleted.`,
          variant: "destructive",
        });
        return;
      }

      if (hasSubcategories) {
        if (!confirm(`This parent category has ${category.subcategories!.length} subcategories. Are you sure you want to delete "${category.name}" and all its subcategories?`)) {
          return;
        }
      } else {
        if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
          return;
        }
      }

      // Delete the category (cascade will handle subcategories)
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${isParent ? 'Parent category' : 'Subcategory'} deleted successfully`,
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

  const startEdit = (category: HierarchicalCategory) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  const toggleParentExpansion = (parentId: string) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const addSubcategoryToParent = (parentId: string) => {
    setSelectedParentForSubcategory(parentId);
    setExpandedParents(prev => new Set(prev).add(parentId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle>Manage Expense Categories</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* Add Parent Category */}
          <div className="flex-shrink-0 flex items-end space-x-2">
            <div className="flex-1">
              <Label htmlFor="new-parent-category">Add Parent Category</Label>
              <Input
                id="new-parent-category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter parent category name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddParentCategory()}
              />
            </div>
            <Button onClick={handleAddParentCategory} disabled={!newCategoryName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Parent
            </Button>
          </div>

          {/* Add Subcategory */}
          <div className="flex-shrink-0 flex items-end space-x-2">
            <div className="flex-1">
              <Label htmlFor="parent-select">Add Subcategory</Label>
              <Select value={selectedParentForSubcategory} onValueChange={setSelectedParentForSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="new-subcategory">&nbsp;</Label>
              <Input
                id="new-subcategory"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Enter subcategory name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
              />
            </div>
            <Button 
              onClick={handleAddSubcategory} 
              disabled={!newSubcategoryName.trim() || !selectedParentForSubcategory}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sub
            </Button>
          </div>

          {/* Hierarchical Categories List */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4">
            {parentCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No categories yet. Add a parent category above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {parentCategories.map((parent) => (
                  <div key={parent.id} className="border rounded-lg">
                    {/* Parent Category Row */}
                    <div className="flex items-center justify-between p-3 bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleParentExpansion(parent.id)}
                          className="p-1 hover:bg-background rounded"
                        >
                          {expandedParents.has(parent.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        {editingCategory?.id === parent.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                              className="h-8"
                            />
                            <Button size="sm" onClick={handleEditCategory}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="font-semibold text-primary">{parent.name}</span>
                        )}
                      </div>
                      
                      {editingCategory?.id !== parent.id && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addSubcategoryToParent(parent.id)}
                            className="h-8 px-2"
                          >
                            <FolderPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(parent)}
                            className="h-8 px-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(parent)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Subcategories */}
                    {expandedParents.has(parent.id) && (
                      <div className="border-t">
                        {parent.subcategories && parent.subcategories.length > 0 ? (
                          parent.subcategories.map((subcategory) => (
                            <div key={subcategory.id} className="flex items-center justify-between p-3 pl-12 border-b last:border-b-0">
                              {editingCategory?.id === subcategory.id ? (
                                <div className="flex items-center space-x-2 flex-1">
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                                    className="h-8"
                                  />
                                  <Button size="sm" onClick={handleEditCategory}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-muted-foreground">• {subcategory.name}</span>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEdit(subcategory)}
                                      className="h-8 px-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(subcategory)}
                                      className="h-8 px-2 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 pl-12 text-muted-foreground text-sm">
                            No subcategories yet. Click the + icon above to add one.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};