
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, GripVertical, X, Menu } from 'lucide-react';
import { QuoteLineItem } from '@/hooks/quotes';

interface QuoteEditorLineItemsSectionProps {
  lineItems: Partial<QuoteLineItem>[];
  handleLineItemChange: (index: number, field: string, value: string | number) => void;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
}

const QuoteEditorLineItemsSection: React.FC<QuoteEditorLineItemsSectionProps> = ({
  lineItems,
  handleLineItemChange,
  addLineItem,
  removeLineItem,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle className="text-lg">Products & Services</CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_100px_120px_120px_40px] gap-3 pb-3 border-b text-sm font-semibold text-muted-foreground">
            <div></div>
            <div>Product / Service</div>
            <div className="text-right">Qty.</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Total</div>
            <div></div>
          </div>

          {/* Line Items */}
          <div className="space-y-0">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-[40px_1fr_100px_120px_120px_40px] gap-3 items-start py-4 border-b last:border-b-0">
                {/* Drag Handle */}
                <div className="flex items-center justify-center pt-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-move" />
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
                  {lineItems.length > 1 && (
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
            ))}
          </div>
        </div>

        {/* Mobile Card View - Visible only on mobile */}
        <div className="md:hidden space-y-4">
          {lineItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
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
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 mt-4 border-t">
          <Button 
            type="button" 
            onClick={addLineItem}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={addLineItem}
            className="flex-1 h-10"
          >
            <Menu className="h-4 w-4 mr-2" />
            Add Text
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorLineItemsSection;
