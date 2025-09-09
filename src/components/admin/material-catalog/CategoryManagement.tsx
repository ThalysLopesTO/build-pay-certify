import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save, X, GripVertical } from "lucide-react";
import { useMaterialCategories, useMaterialCategoryMutations } from "@/hooks/useMaterialCategories";

export function CategoryManagement() {
  const { data: categories = [], isLoading } = useMaterialCategories();
  const { createCategory, updateCategory, deleteCategory, isCreating, isUpdating } = useMaterialCategoryMutations();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleStartEdit = (category: any) => {
    setEditingId(category.id);
    setEditValue(category.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      updateCategory({
        id: editingId,
        name: editValue.trim(),
      });
      setEditingId(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategory({
        name: newCategoryName.trim(),
        sort_order: categories.length,
      });
      setNewCategoryName("");
      setShowAddForm(false);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      deleteCategory(categoryId);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Material Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage your material categories for better organization
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Add New Category Form */}
      {showAddForm && (
        <Card className="p-4 border-dashed">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCategory();
                if (e.key === "Escape") {
                  setShowAddForm(false);
                  setNewCategoryName("");
                }
              }}
              autoFocus
            />
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreating}
              size="sm"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewCategoryName("");
              }}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              {editingId === category.id ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="h-8 w-48"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Order: {category.sort_order}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {editingId === category.id ? (
                <>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={!editValue.trim() || isUpdating}
                    size="sm"
                    variant="ghost"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleStartEdit(category)}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteCategory(category.id)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No categories found. Create your first category to get started.</p>
          </div>
        )}
      </div>
    </Card>
  );
}