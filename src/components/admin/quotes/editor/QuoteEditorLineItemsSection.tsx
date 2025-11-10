
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileText } from 'lucide-react';
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Products & Services</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[2fr_100px_120px_120px_40px] gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
            <div>Description</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Amount</div>
            <div></div>
          </div>

          {/* Line Items */}
          {lineItems.map((item, index) => (
            <div 
              key={index} 
              className="grid grid-cols-1 md:grid-cols-[2fr_100px_120px_120px_40px] gap-4 items-start py-3 md:py-2 hover:bg-muted/50 rounded-lg px-2 border md:border-0 mb-4 md:mb-0"
            >
              <div className="space-y-2">
                <Input 
                  placeholder="Item name"
                  className="font-medium"
                  value={item.description || ''}
                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                  autoComplete="off"
                />
                <Textarea 
                  placeholder="Vendor (optional)"
                  rows={2}
                  className="text-sm"
                  value={item.vendor || ''}
                  onChange={(e) => handleLineItemChange(index, 'vendor', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex items-center md:block gap-2">
                <span className="md:hidden text-sm text-muted-foreground w-24">Qty:</span>
                <Input 
                  type="number" 
                  className="text-center"
                  value={item.quantity || 1}
                  onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                />
              </div>
              <div className="flex items-center md:block gap-2">
                <span className="md:hidden text-sm text-muted-foreground w-24">Unit Price:</span>
                <Input 
                  type="number" 
                  className="text-right"
                  value={item.unit_price || 0}
                  onChange={(e) => handleLineItemChange(index, 'unit_price', Number(e.target.value))}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                />
              </div>
              <div className="flex items-center md:block gap-2 md:text-right font-medium pt-2">
                <span className="md:hidden text-sm text-muted-foreground w-24">Amount:</span>
                <span>${(Number(item.amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex md:block justify-end">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeLineItem(index)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addLineItem}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addLineItem}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Add Text
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorLineItemsSection;
