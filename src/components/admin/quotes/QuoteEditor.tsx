
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Send } from 'lucide-react';
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
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { QuoteEmailSender } from '../QuoteEmailSender';
import QuoteEditorClientSection from './editor/QuoteEditorClientSection';
import QuoteEditorJobSection from './editor/QuoteEditorJobSection';
import QuoteEditorLineItemsSection from './editor/QuoteEditorLineItemsSection';
import QuoteEditorDetailsCard from './editor/QuoteEditorDetailsCard';
import QuoteEditorTotalsCard from './editor/QuoteEditorTotalsCard';
import { ChangeRequestResponseCard } from './ChangeRequestResponseCard';
import { useToast } from '@/hooks/use-toast';

interface QuoteEditorProps {
  quote: Quote | null;
  onClose: () => void;
}

const QuoteEditor: React.FC<QuoteEditorProps> = ({ quote, onClose }) => {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    project_name: '',
    quote_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'draft' as 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced',
    tax: settings?.tax_percentage || 0,
    discount: 0,
    notes: '',
    template: 'classic',
  });

  const [lineItems, setLineItems] = useState<Partial<QuoteLineItem>[]>([
    { description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [savedQuote, setSavedQuote] = useState<Quote | null>(null);

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const { data: existingLineItems = [] } = useQuoteLineItems(quote?.id || '');
  const createLineItem = useCreateQuoteLineItem();
  const updateLineItem = useUpdateQuoteLineItem();
  const deleteLineItem = useDeleteQuoteLineItem();

  // Initialize form data
  useEffect(() => {
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
        status: quote.status || 'draft',
        tax: quote.tax || 0,
        discount: quote.discount || 0,
        notes: quote.notes || '',
        template: quote.template || 'classic',
      });
      
      if (existingLineItems.length > 0) {
        setLineItems(existingLineItems);
      }
    } else {
      setFormData({
        client_name: '',
        client_company: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        project_name: '',
        quote_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        status: 'draft',
        tax: settings?.tax_percentage || 0,
        discount: 0,
        notes: '',
        template: 'classic',
      });
      setLineItems([{ description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0 }]);
    }
  }, [quote?.id, existingLineItems.length, settings?.tax_percentage]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      const subtotal = calculateSubtotal();
      const discountAmount = Math.min(Number(formData.discount) || 0, subtotal);
      const taxAmount = (subtotal - discountAmount) * (Number(formData.tax) / 100);
      const total = subtotal - discountAmount + taxAmount;

      let resultQuote: Quote;

      if (quote) {
        await updateQuote.mutateAsync({
          id: quote.id,
          updates: { 
            ...formData,
            subtotal,
            total_amount: total
          }
        });
        
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
        resultQuote = { ...quote, ...formData, subtotal, total_amount: total };
      } else {
        const newQuote = await createQuote.mutateAsync({
          ...formData,
          status: formData.status,
          subtotal,
          total_amount: total,
          quote_number: '',
        });
        
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
        resultQuote = newQuote;
      }

      setSavedQuote(resultQuote);
      
      toast({
        title: "Success",
        description: quote ? "Quote updated successfully" : "Quote created successfully",
      });

      return resultQuote;
    } catch (error) {
      console.error('Failed to save quote:', error);
      toast({
        title: "Error",
        description: "Failed to save quote. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSaveAndSend = async () => {
    try {
      const result = await handleSubmit();
      if (result) {
        setSavedQuote(result);
        setIsEmailModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to save quote before sending:', error);
    }
  };

  const handleEmailSent = () => {
    setIsEmailModalOpen(false);
    onClose();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Action Bar - Sticky */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onClose} type="button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quotes
              </Button>
              <div className="border-l h-8" />
              <h1 className="text-2xl font-bold">
                Quote for {formData.client_name || 'New Client'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="default" onClick={() => handleSubmit()}>
                <Save className="h-4 w-4 mr-2" />
                Save Quote
              </Button>
              <Button 
                type="button" 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveAndSend}
              >
                <Send className="h-4 w-4 mr-2" />
                Save & Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Change Request Response Card - Show if quote has changes requested */}
              {quote && quote.public_status === 'changes_requested' && quote.client_change_request && (
                <ChangeRequestResponseCard
                  quoteId={quote.id}
                  clientName={quote.client_name}
                  clientChangeRequest={quote.client_change_request}
                  requestedAt={quote.client_change_request ? new Date().toISOString() : ''}
                  adminResponse={quote.admin_response_to_changes}
                  adminRespondedAt={quote.admin_responded_at}
                />
              )}
              
              <QuoteEditorClientSection
                formData={formData}
                handleInputChange={handleInputChange}
              />
              
              <QuoteEditorJobSection
                formData={formData}
                handleInputChange={handleInputChange}
              />
              
              <QuoteEditorLineItemsSection
                lineItems={lineItems}
                handleLineItemChange={handleLineItemChange}
                addLineItem={addLineItem}
                removeLineItem={removeLineItem}
              />
            </div>

            {/* RIGHT COLUMN - Sticky */}
            <div className="space-y-6">
              <div className="lg:sticky lg:top-24">
                <QuoteEditorDetailsCard
                  formData={formData}
                  handleInputChange={handleInputChange}
                  quote={quote}
                />
                
                <QuoteEditorTotalsCard
                  formData={formData}
                  calculateSubtotal={calculateSubtotal}
                  handleInputChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {savedQuote && (
        <QuoteEmailSender
          quote={savedQuote}
          isOpen={isEmailModalOpen}
          onClose={handleEmailSent}
        />
      )}
    </div>
  );
};

export default QuoteEditor;
