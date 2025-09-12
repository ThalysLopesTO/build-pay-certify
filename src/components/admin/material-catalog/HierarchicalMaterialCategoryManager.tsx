import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useHierarchicalMaterialCategories, HierarchicalMaterialCategory } from '@/hooks/useHierarchicalMaterialCategories';
import { useMaterialCategoryMutations } from '@/hooks/useMaterialCategories';
import { toast } from 'sonner';

interface HierarchicalMaterialCategoryManagerProps {
  // No props needed - component manages its own data
}

export const HierarchicalMaterialCategoryManager = ({}: HierarchicalMaterialCategoryManagerProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newParentCategoryName, setNewParentCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentForSubcategory, setSelectedParentForSubcategory] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<HierarchicalMaterialCategory | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { organizedCategories, refetch } = useHierarchicalMaterialCategories();
  const { createCategory, updateCategory, deleteCategory } = useMaterialCategoryMutations();

  const handleAddParentCategory = async () => {
    if (!newParentCategoryName.trim()) return;

    try {
      await createCategory({
        name: newParentCategoryName.trim(),
        sort_order: organizedCategories.length
      });
      setNewParentCategoryName('');
      await refetch();
      toast.success('Parent category created successfully');
    } catch (error) {
      console.error('Error creating parent category:', error);
      toast.error('Failed to create parent category');
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedParentForSubcategory) return;

    try {
      const parent = organizedCategories.find(cat => cat.id === selectedParentForSubcategory);
      const subcategoryCount = parent?.subcategories?.length || 0;

      // Create subcategory with parent_category_id and category_level
      const subcategoryData = {
        name: newSubcategoryName.trim(),
        sort_order: subcategoryCount,
        parent_category_id: selectedParentForSubcategory,
        category_level: 'subcategory' as const
      };

      await createCategory(subcategoryData);
      setNewSubcategoryName('');
      setSelectedParentForSubcategory('');
      await refetch();
      toast.success('Subcategory created successfully');
    } catch (error) {
      console.error('Error creating subcategory:', error);
      toast.error('Failed to create subcategory');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingName.trim()) return;

    try {
      await updateCategory({
        id: editingCategory.id,
        name: editingName.trim()
      });
      setEditingCategory(null);
      setEditingName('');
      await refetch();
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    console.log("🗑️ Component: Starting delete for category:", categoryId);
    try {
      await deleteCategory(categoryId);
      // Refresh local data immediately
      await refetch();
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const startEdit = (category: HierarchicalMaterialCategory) => {
    setEditingCategory(category);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingName('');
  };

  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedCategories(newExpanded);
  };

  const addSubcategoryToParent = (parentId: string) => {
    setSelectedParentForSubcategory(parentId);
    const newExpanded = new Set(expandedCategories);
    newExpanded.add(parentId);
    setExpandedCategories(newExpanded);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Manage Categories
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Material Categories</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add New Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="new-parent-category">Add New Parent Category</Label>
              <div className="flex gap-2">
                <Input
                  id="new-parent-category"
                  value={newParentCategoryName}
                  onChange={(e) => setNewParentCategoryName(e.target.value)}
                  placeholder="Enter parent category name"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddParentCategory()}
                />
                <Button onClick={handleAddParentCategory} disabled={!newParentCategoryName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Parent
                </Button>
              </div>
            </div>

            {/* Add New Subcategory */}
            <div className="space-y-2">
              <Label htmlFor="new-subcategory">Add New Subcategory</Label>
              <div className="flex gap-2">
                <Input
                  id="new-subcategory"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder="Enter subcategory name"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                />
                <Button 
                  onClick={handleAddSubcategory} 
                  disabled={!newSubcategoryName.trim() || !selectedParentForSubcategory}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subcategory
                </Button>
              </div>
              {selectedParentForSubcategory && (
                <p className="text-sm text-muted-foreground">
                  Adding to: {organizedCategories.find(cat => cat.id === selectedParentForSubcategory)?.name}
                </p>
              )}
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <Label>Current Categories</Label>
              <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                {organizedCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No categories yet</p>
                ) : (
                  organizedCategories.map((parent) => (
                    <div key={parent.id} className="space-y-1">
                      {/* Parent Category */}
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleParentExpansion(parent.id)}
                            className="h-6 w-6 p-0"
                          >
                            {expandedCategories.has(parent.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          {editingCategory?.id === parent.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-8"
                                onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                              />
                              <Button size="sm" onClick={handleEditCategory}>Save</Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                            </div>
                          ) : (
                            <span className="font-medium">{parent.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addSubcategoryToParent(parent.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(parent)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {parent.subcategories && parent.subcategories.length > 0
                                    ? `This will delete "${parent.name}" and all its ${parent.subcategories.length} subcategories. This action cannot be undone.`
                                    : `This will delete "${parent.name}". This action cannot be undone.`
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(parent.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {expandedCategories.has(parent.id) && (
                        <div className="ml-8 space-y-1">
                          {parent.subcategories?.map((subcategory) => (
                            <div
                              key={subcategory.id}
                              className="flex items-center justify-between p-2 bg-background border rounded"
                            >
                              {editingCategory?.id === subcategory.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="h-8"
                                    onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                                  />
                                  <Button size="sm" onClick={handleEditCategory}>Save</Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{subcategory.name}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(subcategory)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will delete "{subcategory.name}". This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCategory(subcategory.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};