
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
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle className="text-lg">Products & Services</CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-3 md:p-4 space-y-3 bg-card">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Item Description *</label>
                  <Input
                    value={item.description || ''}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="e.g., Custom Kitchen Cabinets"
                    required
                    autoComplete="off"
                    className="h-11 md:h-10"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Vendor (Optional)</label>
                  <Input
                    value={item.vendor || ''}
                    onChange={(e) => handleLineItemChange(index, 'vendor', e.target.value)}
                    placeholder="Vendor name"
                    autoComplete="off"
                    className="h-11 md:h-10"
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
                      className="h-11 md:h-10"
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
                      className="h-11 md:h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Amount: </span>
                  <span className="font-semibold text-base md:text-lg">${(item.amount || 0).toFixed(2)}</span>
                </div>
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 md:h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Add Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addLineItem}
              className="flex-1 h-11 md:h-10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addLineItem}
              className="flex-1 h-11 md:h-10"
            >
              <FileText className="h-4 w-4 mr-2" />
              Add Text Entry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorLineItemsSection;
