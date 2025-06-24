
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Quote, QuoteLineItem, useCreateQuote, useUpdateQuote, useQuoteLineItems, useCreateQuoteLineItem, useUpdateQuoteLineItem, useDeleteQuoteLineItem } from '@/hooks/useQuotes';

interface QuoteFormModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ quote, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    project_name: '',
    quote_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    tax: 0,
    discount: 0,
    notes: '',
  });

  const [lineItems, setLineItems] = useState<Partial<QuoteLineItem>[]>([
    { description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const { data: existingLineItems = [] } = useQuoteLineItems(quote?.id || '');
  const createLineItem = useCreateQuoteLineItem();
  const updateLineItem = useUpdateQuoteLineItem();
  const deleteLineItem = useDeleteQuoteLineItem();

  // Reset form when modal opens/closes or quote changes
  useEffect(() => {
    if (isOpen) {
      if (quote) {
        setFormData({
          client_name: quote.client_name || '',
          client_company: quote.client_company || '',
          client_email: quote.client_email || '',
          client_phone: quote.client_phone || '',
          client_address: quote.client_address || '',
          project_name: quote.project_name || '',
          quote_date: quote.quote_date || new Date().toISOString().split('T')[0],
          expiry_date: quote.expiry_date || '',
          tax: quote.tax || 0,
          discount: quote.discount || 0,
          notes: quote.notes || '',
        });
        
        if (existingLineItems.length > 0) {
          setLineItems(existingLineItems);
        }
      } else {
        // Reset form for new quote
        setFormData({
          client_name: '',
          client_company: '',
          client_email: '',
          client_phone: '',
          client_address: '',
          project_name: '',
          quote_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
          tax: 0,
          discount: 0,
          notes: '',
        });
        setLineItems([{ description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }]);
      }
    }
  }, [quote, existingLineItems, isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    console.log('Input change:', field, value); // Debug log
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    console.log('Line item change:', index, field, value); // Debug log
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = Number(updatedItems[index].quantity || 0);
      const unitPrice = Number(updatedItems[index].unit_price || 0);
      updatedItems[index].amount = quantity * unitPrice;
    }
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = async (index: number) => {
    const item = lineItems[index];
    
    if (item.id) {
      await deleteLineItem.mutateAsync({ id: item.id, quoteId: quote!.id });
    }
    
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData); // Debug log
    
    try {
      if (quote) {
        // Update existing quote
        await updateQuote.mutateAsync({
          id: quote.id,
          updates: { ...formData }
        });
        
        // Update line items
        for (const item of lineItems) {
          if (item.id) {
            await updateLineItem.mutateAsync({
              id: item.id,
              updates: {
                description: item.description || '',
                vendor: item.vendor || '',
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
              }
            });
          } else {
            await createLineItem.mutateAsync({
              ...item,
              quote_id: quote.id,
              description: item.description || '',
              quantity: Number(item.quantity) || 1,
              unit_price: Number(item.unit_price) || 0,
            });
          }
        }
      } else {
        // Create new quote with all required fields
        const subtotal = calculateSubtotal();
        const discountAmount = subtotal * (Number(formData.discount) / 100);
        const taxAmount = (subtotal - discountAmount) * (Number(formData.tax) / 100);
        const total = subtotal - discountAmount + taxAmount;

        const newQuote = await createQuote.mutateAsync({
          ...formData,
          status: 'draft',
          subtotal,
          total_amount: total,
          quote_number: '', // Will be auto-generated by the database trigger
        });
        
        // Create line items
        for (const item of lineItems) {
          if (item.description) {
            await createLineItem.mutateAsync({
              ...item,
              quote_id: newQuote.id,
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unit_price: Number(item.unit_price) || 0,
            });
          }
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save quote:', error);
    }
  };

  const subtotal = calculateSubtotal();
  const discountAmount = subtotal * (Number(formData.discount) / 100);
  const taxAmount = (subtotal - discountAmount) * (Number(formData.tax) / 100);
  const total = subtotal - discountAmount + taxAmount;

  // Add click handler to prevent event propagation issues
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onClick={handleDialogClick}>
        <DialogHeader>
          <DialogTitle>{quote ? 'Edit Quote' : 'Create New Quote'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="client_company">Company</Label>
                  <Input
                    id="client_company"
                    name="client_company"
                    type="text"
                    value={formData.client_company}
                    onChange={(e) => handleInputChange('client_company', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="client_email">Email *</Label>
                  <Input
                    id="client_email"
                    name="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="client_phone">Phone</Label>
                  <Input
                    id="client_phone"
                    name="client_phone"
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="client_address">Address</Label>
                <Textarea
                  id="client_address"
                  name="client_address"
                  value={formData.client_address}
                  onChange={(e) => handleInputChange('client_address', e.target.value)}
                  autoComplete="off"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quote Information */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    name="project_name"
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => handleInputChange('project_name', e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="quote_date">Quote Date</Label>
                  <Input
                    id="quote_date"
                    name="quote_date"
                    type="date"
                    value={formData.quote_date}
                    onChange={(e) => handleInputChange('quote_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    name="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
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

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Discount:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => handleInputChange('discount', Number(e.target.value))}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-20"
                        autoComplete="off"
                      />
                      <span>%</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Tax:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={formData.tax}
                        onChange={(e) => handleInputChange('tax', Number(e.target.value))}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-20"
                        autoComplete="off"
                      />
                      <span>%</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes or terms..."
                rows={4}
                autoComplete="off"
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {quote ? 'Update Quote' : 'Create Quote'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteFormModal;
