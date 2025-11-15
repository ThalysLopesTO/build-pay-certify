
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { QuoteLineItem } from '@/hooks/quotes';
import QuoteTotalsDisplay from './QuoteTotalsDisplay';

interface QuoteLineItemsSectionProps {
  lineItems: Partial<QuoteLineItem>[];
  formData: {
    discount: number;
    tax: number;
  };
  handleLineItemChange: (index: number, field: string, value: string | number) => void;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  calculateSubtotal: () => number;
  handleInputChange: (field: string, value: number) => void;
}

const QuoteLineItemsSection: React.FC<QuoteLineItemsSectionProps> = ({
  lineItems,
  formData,
  handleLineItemChange,
  addLineItem,
  removeLineItem,
  calculateSubtotal,
  handleInputChange,
}) => {
  const subtotal = calculateSubtotal();
  const discountAmount = Math.min(Number(formData.discount) || 0, subtotal);
  const taxAmount = (subtotal - discountAmount) * (Number(formData.tax) / 100);
  const total = subtotal - discountAmount + taxAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Quote Items
          <Button type="button" onClick={addLineItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={item.description || ''}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                    autoComplete="off"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.vendor || ''}
                    onChange={(e) => handleLineItemChange(index, 'vendor', e.target.value)}
                    placeholder="Vendor"
                    autoComplete="off"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.quantity || 1}
                    onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                    min="0"
                    step="0.01"
                    autoComplete="off"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.unit_price || 0}
                    onChange={(e) => handleLineItemChange(index, 'unit_price', Number(e.target.value))}
                    min="0"
                    step="0.01"
                    autoComplete="off"
                  />
                </TableCell>
                <TableCell>
                  ${(Number(item.amount) || 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <QuoteTotalsDisplay
          subtotal={subtotal}
          formData={formData}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          total={total}
          handleInputChange={handleInputChange}
        />
      </CardContent>
    </Card>
  );
};

export default QuoteLineItemsSection;
