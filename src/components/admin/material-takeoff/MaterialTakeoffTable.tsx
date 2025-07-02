import React, { useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MaterialTakeoff } from '@/hooks/useMaterialTakeoffsEnhanced';
import { Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react';

interface MaterialTakeoffTableProps {
  takeoffs: MaterialTakeoff[];
  selectedItems: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (takeoff: MaterialTakeoff) => void;
  onDelete: (id: string) => void;
  onInlineUpdate: (id: string, updates: Partial<MaterialTakeoff>) => void;
  isLoading?: boolean;
}

interface EditingCell {
  id: string;
  field: string;
  value: any;
}

const MaterialTakeoffTable: React.FC<MaterialTakeoffTableProps> = ({
  takeoffs,
  selectedItems,
  onSelectionChange,
  onEdit,
  onDelete,
  onInlineUpdate,
  isLoading,
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const handleSelectAll = () => {
    if (selectedItems.length === takeoffs.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(takeoffs.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelection = selectedItems.includes(id)
      ? selectedItems.filter(itemId => itemId !== id)
      : [...selectedItems, id];
    onSelectionChange(newSelection);
  };

  const startEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field, value: currentValue });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const updates = { [editingCell.field]: editValue };
    onInlineUpdate(editingCell.id, updates);
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_requested':
        return 'bg-secondary text-secondary-foreground';
      case 'partially_requested':
        return 'bg-warning text-warning-foreground';
      case 'fully_requested':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const renderEditableCell = (takeoff: MaterialTakeoff, field: string, value: any, type: 'text' | 'number' = 'text') => {
    const isEditing = editingCell?.id === takeoff.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={saveEdit}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 p-1 rounded"
        onClick={() => startEdit(takeoff.id, field, value)}
      >
        {type === 'number' && typeof value === 'number' ? value.toFixed(2) : value || '-'}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading material takeoffs...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedItems.length === takeoffs.length && takeoffs.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Jobsite</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {takeoffs.map((takeoff) => (
            <TableRow 
              key={takeoff.id}
              className={selectedItems.includes(takeoff.id) ? 'bg-muted/50' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(takeoff.id)}
                  onCheckedChange={() => handleSelectItem(takeoff.id)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {renderEditableCell(takeoff, 'material_name', takeoff.material_name)}
              </TableCell>
              <TableCell>
                {renderEditableCell(takeoff, 'unit', takeoff.unit)}
              </TableCell>
              <TableCell>
                {renderEditableCell(takeoff, 'total_qty_estimated', takeoff.total_qty_estimated, 'number')}
              </TableCell>
              <TableCell>
                ${renderEditableCell(takeoff, 'unit_price', takeoff.unit_price, 'number')}
              </TableCell>
              <TableCell className="font-medium">
                ${takeoff.subtotal.toFixed(2)}
              </TableCell>
              <TableCell>
                <span className={takeoff.requested_qty > 0 ? 'font-semibold text-primary' : ''}>
                  {takeoff.requested_qty}
                </span>
              </TableCell>
              <TableCell>
                <span className={takeoff.remaining_qty < 0 ? 'font-semibold text-destructive' : ''}>
                  {takeoff.remaining_qty}
                  {takeoff.remaining_qty < 0 && (
                    <AlertTriangle className="h-4 w-4 inline ml-1 text-destructive" />
                  )}
                </span>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(takeoff.status)}>
                  {takeoff.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {renderEditableCell(takeoff, 'vendor', takeoff.vendor)}
              </TableCell>
              <TableCell>
                {renderEditableCell(takeoff, 'category', takeoff.category)}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    takeoff.priority >= 4 ? 'bg-red-500' : 
                    takeoff.priority >= 3 ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  {renderEditableCell(takeoff, 'priority', takeoff.priority, 'number')}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-sm">{takeoff.jobsite_name}</div>
                  {takeoff.jobsite_address && (
                    <div className="text-xs text-muted-foreground">{takeoff.jobsite_address}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(takeoff)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(takeoff.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaterialTakeoffTable;