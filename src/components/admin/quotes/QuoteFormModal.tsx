
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Quote, 
  QuoteLineItem, 
  useCreateQuote, 
  useUpdateQuote, 
  useQuoteLineItems, 
  useCreateQuoteLineItem, 
  useUpdateQuoteLineItem, 
  useDeleteQuoteLineItem 
} from '@/hooks/quotes';
import QuoteClientSection from './sections/QuoteClientSection';
import QuoteDetailsSection from './sections/QuoteDetailsSection';
import QuoteLineItemsSection from './sections/QuoteLineItemsSection';
import QuoteNotesSection from './sections/QuoteNotesSection';
import QuoteTemplateSection from './sections/QuoteTemplateSection';

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
    template: 'classic',
  });

  const [lineItems, setLineItems] = useState<Partial<QuoteLineItem>[]>([
    { description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  const [isInitialized, setIsInitialized] = useState(false);

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const { data: existingLineItems = [] } = useQuoteLineItems(quote?.id || '');
  const createLineItem = useCreateQuoteLineItem();
  const updateLineItem = useUpdateQuoteLineItem();
  const deleteLineItem = useDeleteQuoteLineItem();

  // Initialize form data only when modal opens and quote changes
  useEffect(() => {
    if (isOpen && !isInitialized) {
      console.log('Initializing form data for quote:', quote?.id);
      
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
          template: quote.template || 'classic',
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
          template: 'classic',
        });
        setLineItems([{ description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }]);
      }
      
      setIsInitialized(true);
    }
  }, [isOpen, quote?.id, existingLineItems.length, isInitialized]);

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    console.log('Input change:', field, value); // Debug log
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    console.log('Line item change:', index, field, value); // Debug log
    setLineItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = Number(updatedItems[index].quantity || 0);
        const unitPrice = Number(updatedItems[index].unit_price || 0);
        updatedItems[index].amount = quantity * unitPrice;
      }
      
      return updatedItems;
    });
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, { description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = async (index: number) => {
    const item = lineItems[index];
    
    if (item.id) {
      await deleteLineItem.mutateAsync({ id: item.id, quoteId: quote!.id });
    }
    
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData); // Debug log
    
    try {
      if (quote) {
        // Update existing quote with recalculated totals
        const subtotal = calculateSubtotal();
        const discountAmount = subtotal * (Number(formData.discount) / 100);
        const taxAmount = (subtotal - discountAmount) * (Number(formData.tax) / 100);
        const total = subtotal - discountAmount + taxAmount;

        await updateQuote.mutateAsync({
          id: quote.id,
          updates: { 
            ...formData,
            subtotal,
            total_amount: total
          }
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

  // Add click handler to prevent event propagation issues
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTemplateChange = (template: string) => {
    handleInputChange('template', template);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onClick={handleDialogClick}>
        <DialogHeader>
          <DialogTitle>{quote ? 'Edit Quote' : 'Create New Quote'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <QuoteClientSection
            formData={formData}
            handleInputChange={handleInputChange}
          />

          <QuoteDetailsSection
            formData={formData}
            handleInputChange={handleInputChange}
          />

          <QuoteLineItemsSection
            lineItems={lineItems}
            formData={formData}
            handleLineItemChange={handleLineItemChange}
            addLineItem={addLineItem}
            removeLineItem={removeLineItem}
            calculateSubtotal={calculateSubtotal}
            handleInputChange={handleInputChange}
          />

          <QuoteNotesSection
            notes={formData.notes}
            handleInputChange={handleInputChange}
          />

          <QuoteTemplateSection
            selectedTemplate={formData.template}
            onTemplateChange={handleTemplateChange}
          />

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
