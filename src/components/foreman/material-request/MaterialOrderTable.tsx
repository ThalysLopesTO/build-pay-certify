import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MaterialDropdownSelector } from './MaterialDropdownSelector';

import { Plus, Trash2, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MATERIAL_UNITS } from '@/hooks/useMaterialCatalog';
import { useHierarchicalMaterialCategories } from '@/hooks/useHierarchicalMaterialCategories';
import { ExpandableTreeCategorySelector } from './ExpandableTreeCategorySelector';

export interface OrderLineItem {
  id: string;
  quantity: number;
  unit: string;
  category: string;
  materialName: string;
  notes: string;
  isCustom: boolean;
  catalogItemId?: string;
}

interface MaterialOrderTableProps {
  lineItems: OrderLineItem[];
  onChange: (lineItems: OrderLineItem[]) => void;
  errors?: { [key: string]: string };
}

export const MaterialOrderTable: React.FC<MaterialOrderTableProps> = ({
  lineItems,
  onChange,
  errors = {},
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const { organizedCategories, getCategoryDisplay } = useHierarchicalMaterialCategories();

  // Mobile card component
  const MobileItemCard: React.FC<{ item: OrderLineItem; index: number }> = ({ item, index }) => (
    <Card className={`${errors[item.id] ? 'border-destructive' : ''}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="text-sm font-medium">Item #{index + 1}</div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => duplicateLine(item)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeLine(item.id)}
              disabled={lineItems.length === 1}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Quantity</label>
            <Input
              type="number"
              min="1"
              step="0.1"
              value={item.quantity}
              onChange={(e) => updateLine(item.id, 'quantity', parseFloat(e.target.value) || 1)}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Unit</label>
            <Select
              value={item.unit}
              onValueChange={(value) => updateLine(item.id, 'unit', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {MATERIAL_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                  <ExpandableTreeCategorySelector
                    selectedCategoryId={item.category}
                    onCategoryChange={(categoryId) => handleCategorySelect(item.id, categoryId)}
                  />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Material</label>
          {item.isCustom && !item.materialName ? (
            <Input
              value=""
              placeholder="Enter custom material name..."
              onChange={(e) => handleCustomMaterial(item.id, e.target.value)}
              autoFocus
              className="h-9"
            />
          ) : (
            <MaterialDropdownSelector
              value={item.materialName}
              selectedCategory={item.category}
              onSelect={(catalogItem) => handleMaterialSelect(item.id, catalogItem)}
              onCustom={() => handleCustomMaterial(item.id, '')}
            />
          )}
          <div className="flex gap-2 mt-2">
            {item.isCustom && item.materialName && (
              <Badge variant="outline" className="text-xs">
                Custom
              </Badge>
            )}
            {!item.isCustom && item.category && (
              <Badge variant="secondary" className="text-xs">
                {getCategoryDisplay(item.category)}
              </Badge>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
          {editingCell?.rowId === item.id && editingCell?.field === 'notes' ? (
            <Textarea
              value={item.notes}
              onChange={(e) => updateLine(item.id, 'notes', e.target.value)}
              onBlur={handleCellBlur}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleCellBlur();
                }
              }}
              autoFocus
              rows={2}
              className="resize-none"
            />
          ) : (
            <div
              onClick={() => handleCellEdit(item.id, 'notes')}
              className="min-h-[60px] p-2 rounded border cursor-text hover:bg-muted/50 text-sm"
            >
              {item.notes || 'Tap to add notes...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const addNewLine = () => {
    const newLine: OrderLineItem = {
      id: `line_${Date.now()}`,
      quantity: 1,
      unit: 'pcs',
      category: '',
      materialName: '',
      notes: '',
      isCustom: true,
    };
    onChange([...lineItems, newLine]);
  };

  const duplicateLine = (lineItem: OrderLineItem) => {
    const newLine: OrderLineItem = {
      ...lineItem,
      id: `line_${Date.now()}`,
    };
    const index = lineItems.findIndex(item => item.id === lineItem.id);
    const newLineItems = [...lineItems];
    newLineItems.splice(index + 1, 0, newLine);
    onChange(newLineItems);
  };

  const removeLine = (id: string) => {
    onChange(lineItems.filter(item => item.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    onChange(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleCategorySelect = (id: string, categoryId: string) => {
    // Batch all updates in a single state change to prevent race conditions
    onChange(lineItems.map(item => 
      item.id === id ? { 
        ...item, 
        category: categoryId, 
        materialName: '', 
        catalogItemId: undefined, 
        isCustom: true 
      } : item
    ));
  };

  const handleMaterialSelect = (id: string, catalogItem: any) => {
    // Batch all updates in a single state change
    onChange(lineItems.map(item => 
      item.id === id ? { 
        ...item,
        catalogItemId: catalogItem.id,
        materialName: catalogItem.name,
        unit: catalogItem.unit,
        category: catalogItem.category, // This should be the category ID
        isCustom: false
      } : item
    ));
  };

  const handleCustomMaterial = (id: string, materialName: string) => {
    updateLine(id, 'materialName', materialName);
    updateLine(id, 'catalogItemId', undefined);
    updateLine(id, 'isCustom', true);
  };

  const handleCellEdit = (rowId: string, field: string) => {
    setEditingCell({ rowId, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Material Order</h3>
        <Button onClick={addNewLine} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden space-y-4">
        {lineItems.map((item, index) => (
          <MobileItemCard key={item.id} item={item} index={index} />
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="min-w-[250px]">Material</TableHead>
                <TableHead className="min-w-[200px]">Notes</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, index) => (
                <TableRow key={item.id} className={errors[item.id] ? 'bg-destructive/5' : ''}>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => updateLine(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-16 text-center"
                      placeholder="Qty"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateLine(item.id, 'unit', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {MATERIAL_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                      <ExpandableTreeCategorySelector
                        selectedCategoryId={item.category}
                        onCategoryChange={(categoryId) => handleCategorySelect(item.id, categoryId)}
                      />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {item.isCustom && !item.materialName ? (
                        <Input
                          value=""
                          placeholder="Enter custom material name..."
                          onChange={(e) => handleCustomMaterial(item.id, e.target.value)}
                          autoFocus
                          className="w-full"
                        />
                      ) : (
                        <MaterialDropdownSelector
                          value={item.materialName}
                          selectedCategory={item.category}
                          onSelect={(catalogItem) => handleMaterialSelect(item.id, catalogItem)}
                          onCustom={() => handleCustomMaterial(item.id, '')}
                        />
                      )}
                      {item.isCustom && item.materialName && (
                        <Badge variant="outline" className="text-xs">
                          Custom
                        </Badge>
                      )}
                      {!item.isCustom && item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryDisplay(item.category)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingCell?.rowId === item.id && editingCell?.field === 'notes' ? (
                      <Textarea
                        value={item.notes}
                        onChange={(e) => updateLine(item.id, 'notes', e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleCellBlur();
                          }
                        }}
                        autoFocus
                        rows={2}
                        className="w-full"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.id, 'notes')}
                        className="min-h-[2rem] p-2 rounded cursor-text hover:bg-muted/50 text-sm"
                      >
                        {item.notes || 'Click to add notes...'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateLine(item)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(item.id)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {lineItems.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
          <p className="text-muted-foreground mb-4">No items in your order yet</p>
          <Button onClick={addNewLine}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Item
          </Button>
        </div>
      )}

      
    </div>
  );
};