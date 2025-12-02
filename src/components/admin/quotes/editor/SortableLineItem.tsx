import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, X } from 'lucide-react';
import { QuoteLineItem } from '@/hooks/quotes';

interface SortableLineItemProps {
  id: string;
  index: number;
  item: Partial<QuoteLineItem>;
  isMobile: boolean;
  handleLineItemChange: (index: number, field: string, value: string | number) => void;
  removeLineItem: (index: number) => void;
  showRemoveButton: boolean;
}

const SortableLineItem: React.FC<SortableLineItemProps> = ({
  id,
  index,
  item,
  isMobile,
  handleLineItemChange,
  removeLineItem,
  showRemoveButton,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border rounded-lg p-4 space-y-3 bg-card"
      >
        {/* Drag Handle for Mobile */}
        <div className="flex items-center justify-between">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center gap-2 cursor-move touch-none"
          >
            <GripVertical className="h-6 w-6 text-muted-foreground/50" />
            <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
          </div>
          {showRemoveButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeLineItem(index)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              <span className="ml-1">Remove</span>
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Item Name *</label>
            <Input
              value={item.description || ''}
              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
              placeholder="e.g., Custom Kitchen Cabinets"
              required
              autoComplete="off"
              className="h-11"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description (Optional)</label>
            <Textarea
              value={item.vendor || ''}
              onChange={(e) => handleLineItemChange(index, 'vendor', e.target.value)}
              placeholder="Add details..."
              rows={2}
              autoComplete="off"
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quantity *</label>
              <Input
                type="number"
                value={item.quantity || 1}
                onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
                autoComplete="off"
                onFocus={(e) => e.target.select()}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Unit Price *</label>
              <Input
                type="number"
                value={item.unit_price || 0}
                onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
                autoComplete="off"
                onFocus={(e) => e.target.select()}
                className="h-11"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold text-base">${(item.amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[40px_1fr_100px_120px_120px_40px] gap-3 items-start py-4 border-b last:border-b-0"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center pt-2 cursor-move touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
      </div>

      {/* Product/Service Column */}
      <div className="space-y-2">
        <Input
          placeholder="Name"
          value={item.description || ''}
          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
          required
          autoComplete="off"
          className="h-9"
        />
        <Textarea
          placeholder="Description (optional)"
          value={item.vendor || ''}
          onChange={(e) => handleLineItemChange(index, 'vendor', e.target.value)}
          rows={2}
          autoComplete="off"
          className="resize-none text-sm"
        />
      </div>

      {/* Quantity */}
      <div className="pt-2">
        <Input
          type="number"
          value={item.quantity || 1}
          onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          required
          autoComplete="off"
          onFocus={(e) => e.target.select()}
          className="h-9 text-right"
        />
      </div>

      {/* Unit Price */}
      <div className="pt-2">
        <Input
          type="number"
          value={item.unit_price || 0}
          onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          required
          autoComplete="off"
          onFocus={(e) => e.target.select()}
          className="h-9 text-right"
        />
      </div>

      {/* Total (Read-only) */}
      <div className="pt-2">
        <Input
          value={`$${(item.amount || 0).toFixed(2)}`}
          readOnly
          tabIndex={-1}
          className="h-9 text-right bg-muted font-semibold cursor-default"
        />
      </div>

      {/* Remove Button */}
      <div className="flex items-center justify-center pt-2">
        {showRemoveButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeLineItem(index)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SortableLineItem;
