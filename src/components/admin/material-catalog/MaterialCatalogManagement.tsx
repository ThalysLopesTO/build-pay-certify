import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaterialCategoryGroup } from './MaterialCategoryGroup';
import { MaterialCatalogForm } from './MaterialCatalogForm';
import { MaterialImportDialog } from './MaterialImportDialog';
import { useMaterialCatalog, MATERIAL_CATEGORIES } from '@/hooks/useMaterialCatalog';
import { Search, Plus, Package, Upload } from 'lucide-react';

const MaterialCatalogManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: catalogItems = [], isLoading } = useMaterialCatalog(
    searchTerm, 
    categoryFilter, 
    showActiveOnly
  );

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Material Catalog</h1>
          <p className="text-muted-foreground">Manage your company's material catalog for streamlined ordering</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Catalog Items</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MATERIAL_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showActiveOnly ? "default" : "outline"}
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              className="whitespace-nowrap"
            >
              {showActiveOnly ? "Active Only" : "Show All"}
            </Button>
          </div>

          {/* Category Groups */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                catalogItems.reduce((groups, item) => {
                  const category = item.category;
                  if (!groups[category]) groups[category] = [];
                  groups[category].push(item);
                  return groups;
                }, {} as Record<string, typeof catalogItems>)
              )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, items]) => (
                  <MaterialCategoryGroup
                    key={category}
                    category={category}
                    items={items}
                    onEdit={handleEdit}
                  />
                ))
              }
            </div>
          )}

          {/* Empty State */}
          {!isLoading && catalogItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No materials found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== 'all' 
                  ? "Try adjusting your search or filters" 
                  : "Start building your material catalog by adding your first item"
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Material
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <MaterialCatalogForm
          item={editingItem}
          onClose={handleFormClose}
        />
      )}

      {/* Import Modal */}
      <MaterialImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        existingItems={catalogItems}
      />
    </div>
  );
};

export default MaterialCatalogManagement;