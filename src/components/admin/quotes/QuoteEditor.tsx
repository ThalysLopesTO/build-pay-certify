
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Send, MessageSquare } from 'lucide-react';
import { 
  Quote, 
  QuoteLineItem, 
  PaymentConfig,
  useCreateQuote, 
  useUpdateQuote, 
  useQuoteLineItems, 
  useCreateQuoteLineItem, 
  useUpdateQuoteLineItem, 
  useDeleteQuoteLineItem 
} from '@/hooks/quotes';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuoteEmailSender } from '../QuoteEmailSender';
import QuoteEditorClientSection from './editor/QuoteEditorClientSection';
import QuoteEditorJobSection from './editor/QuoteEditorJobSection';
import QuoteEditorLineItemsSection from './editor/QuoteEditorLineItemsSection';
import QuoteEditorDetailsCard from './editor/QuoteEditorDetailsCard';
import QuoteEditorTotalsCard from './editor/QuoteEditorTotalsCard';
import QuoteEditorMobileHeader from './editor/QuoteEditorMobileHeader';
import QuoteEditorMobileActions from './editor/QuoteEditorMobileActions';
import QuoteEditorClientMessageCard from './editor/QuoteEditorClientMessageCard';
import QuoteEditorContractCard from './editor/QuoteEditorContractCard';
import QuoteEditorInternalNotesCard from './editor/QuoteEditorInternalNotesCard';
import { PaymentScheduleModal } from './editor/PaymentScheduleModal';
import { ChangeRequestResponseCard } from './ChangeRequestResponseCard';
import { useToast } from '@/hooks/use-toast';

interface QuoteEditorProps {
  quote: Quote | null;
  onClose: () => void;
}

const QuoteEditor: React.FC<QuoteEditorProps> = ({ quote, onClose }) => {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const isMobile = useIsMobile();
  
  const [formData, setFormData] = useState({
    quote_number: '',
    client_id: '',
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
    discount_type: 'fixed' as 'percentage' | 'fixed',
    notes: '',
    template: 'classic',
    client_message: '',
    contract_disclaimer: 'This quote is valid for the next 30 days, after which values may be subject to change.',
    internal_notes: '',
  });

  const [lineItems, setLineItems] = useState<Partial<QuoteLineItem>[]>([
    { description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0, _tempId: crypto.randomUUID() }
  ]);

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    mode: 'full',
    deposit_type: 'percentage',
    deposit_value: 0,
    schedule_items: []
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
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
        quote_number: quote.quote_number || '',
        client_id: quote.client_id || '',
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
        discount_type: quote.discount_type || 'fixed',
        notes: quote.notes || '',
        template: quote.template || 'classic',
        client_message: quote.client_message || '',
        contract_disclaimer: quote.contract_disclaimer || 'This quote is valid for the next 30 days, after which values may be subject to change.',
        internal_notes: quote.internal_notes || '',
      });
      
      if (quote.payment_config) {
        setPaymentConfig(quote.payment_config);
      }
      
      if (existingLineItems.length > 0) {
        setLineItems(existingLineItems);
      }
    } else {
      setFormData({
        quote_number: '',
        client_id: '',
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
        discount_type: 'fixed',
        notes: '',
        template: 'classic',
        client_message: '',
        contract_disclaimer: 'This quote is valid for the next 30 days, after which values may be subject to change.',
        internal_notes: '',
      });
      setLineItems([{ description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0, _tempId: crypto.randomUUID() }]);
      setPaymentConfig({
        mode: 'full',
        deposit_type: 'percentage',
        deposit_value: 0,
        schedule_items: []
      });
    }
  }, [quote?.id, existingLineItems.length, settings?.tax_percentage]);

  const handleClientSelect = (client: any) => {
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      client_name: client.client_name,
      client_company: client.client_company || '',
      client_email: client.client_email,
      client_phone: client.client_phone || '',
      client_address: client.client_address || '',
    }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const handleLineItemChange = useCallback((index: number, field: string, value: string | number) => {
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
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems(prev => [...prev, { description: '', vendor: '', quantity: 1, unit_price: 0, amount: 0, _tempId: crypto.randomUUID() }]);
  }, []);

  const removeLineItem = useCallback(async (index: number) => {
    setLineItems(prev => {
      const item = prev[index];
      if (item.id && quote) {
        deleteLineItem.mutate({ id: item.id, quoteId: quote.id });
      }
      return prev.filter((_, i) => i !== index);
    });
  }, [quote, deleteLineItem]);

  const handleReorderLineItems = useCallback((startIndex: number, endIndex: number) => {
    setLineItems(prevItems => {
      const result = Array.from(prevItems);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const handleSubmit = async (eOrReturnToList?: React.FormEvent | boolean) => {
    const returnToList = typeof eOrReturnToList === 'boolean' ? eOrReturnToList : true;
    if (eOrReturnToList && typeof eOrReturnToList !== 'boolean') eOrReturnToList.preventDefault();
    
    
    // Validate client is selected
    if (!formData.client_id || !formData.client_name || !formData.client_email) {
      toast({
        title: "Client Required",
        description: "Please select a client before saving the quote.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const subtotal = calculateSubtotal();
      const discountType = formData.discount_type || 'fixed';
      const discountAmount = discountType === 'percentage'
        ? Math.min((subtotal * (Number(formData.discount) || 0)) / 100, subtotal)
        : Math.min(Number(formData.discount) || 0, subtotal);
      const taxAmount = (subtotal - discountAmount) * (Number(formData.tax) / 100);
      const total = subtotal - discountAmount + taxAmount;

      // Sanitize empty strings to null for optional DB fields
      const sanitizedData = {
        ...formData,
        expiry_date: formData.expiry_date || null,
        client_id: formData.client_id || null,
        client_company: formData.client_company || null,
        client_phone: formData.client_phone || null,
        client_address: formData.client_address || null,
        quote_number: formData.quote_number || undefined,
      };

      let resultQuote: Quote;

      if (quote) {
        await updateQuote.mutateAsync({
          id: quote.id,
          updates: { 
            ...sanitizedData,
            subtotal,
            total_amount: total,
            payment_config: paymentConfig,
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
        resultQuote = { ...quote, ...formData, subtotal, total_amount: total, payment_config: paymentConfig };
      } else {
        const newQuote = await createQuote.mutateAsync({
          ...sanitizedData,
          status: formData.status,
          subtotal,
          total_amount: total,
          payment_config: paymentConfig,
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

      if (returnToList) {
        onClose();
      }

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
      const result = await handleSubmit(false);
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
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      {/* Header - Mobile vs Desktop */}
      {isMobile ? (
        <QuoteEditorMobileHeader
          isEditing={!!quote}
          clientName={formData.client_name}
          onBack={onClose}
          onSave={() => handleSubmit()}
          onSaveAndSend={handleSaveAndSend}
          onCancel={onClose}
        />
      ) : (
        <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onClose} type="button">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Quotes
                </Button>
                <div className="border-l h-8" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">
                    Quote for {formData.client_name || 'New Client'}
                  </h1>
                  {quote && quote.public_status === 'changes_requested' && (
                    <div className="flex items-center gap-2 mt-1">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-600 font-medium">Client Requested Changes</span>
                    </div>
                  )}
                </div>
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
      )}

      {/* Main Editor Content */}
      <div className={`max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-8 ${isMobile ? 'pb-48' : ''}`}>
        <form onSubmit={handleSubmit}>
          <div className={`grid gap-6 md:gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_400px]'}`}>
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Change Request Response Card - Show if quote has changes requested */}
              {quote && quote.public_status === 'changes_requested' && quote.client_change_request && (
                <ChangeRequestResponseCard
                  quoteId={quote.id}
                  clientName={quote.client_name}
                  clientChangeRequest={quote.client_change_request}
                  requestedAt={new Date().toISOString()}
                  onQuoteReset={() => {
                    onClose();
                  }}
                />
              )}
              
              <QuoteEditorClientSection
                selectedClientId={formData.client_id}
                onClientSelect={handleClientSelect}
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
            onReorderLineItems={handleReorderLineItems}
          />
              
              <QuoteEditorClientMessageCard
                value={formData.client_message}
                onChange={(value) => handleInputChange('client_message', value)}
              />
              
              <QuoteEditorContractCard
                value={formData.contract_disclaimer}
                onChange={(value) => handleInputChange('contract_disclaimer', value)}
              />
              
              <QuoteEditorInternalNotesCard
                value={formData.internal_notes}
                onChange={(value) => handleInputChange('internal_notes', value)}
              />
            </div>

            {/* RIGHT COLUMN - Sticky on desktop, inline on mobile */}
            <div className="space-y-6">
              {isMobile ? (
                <>
                  <QuoteEditorDetailsCard
                    formData={formData}
                    handleInputChange={handleInputChange}
                    quote={quote}
                  />
                  <QuoteEditorTotalsCard
                    formData={formData}
                    calculateSubtotal={calculateSubtotal}
                    handleInputChange={handleInputChange}
                    paymentConfig={paymentConfig}
                    onPaymentScheduleClick={() => setIsPaymentModalOpen(true)}
                  />
                </>
              ) : (
                <>
                  <div className="sticky top-24">
                    <QuoteEditorDetailsCard
                      formData={formData}
                      handleInputChange={handleInputChange}
                      quote={quote}
                    />
                  </div>
                  
                  <div className="sticky top-[520px]">
                    <QuoteEditorTotalsCard
                      formData={formData}
                      calculateSubtotal={calculateSubtotal}
                      handleInputChange={handleInputChange}
                      paymentConfig={paymentConfig}
                      onPaymentScheduleClick={() => setIsPaymentModalOpen(true)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Mobile Bottom Action Bar */}
      {isMobile && (
        <QuoteEditorMobileActions
          onSave={() => handleSubmit()}
          onSaveAndSend={handleSaveAndSend}
          onCancel={onClose}
        />
      )}

      {/* Payment Schedule Modal */}
      <PaymentScheduleModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        currentConfig={paymentConfig}
        jobTotal={calculateSubtotal() - (Number(formData.discount) || 0) + ((calculateSubtotal() - (Number(formData.discount) || 0)) * (Number(formData.tax) / 100))}
        onSave={(config) => {
          setPaymentConfig(config);
          setIsPaymentModalOpen(false);
        }}
      />

      {/* Email Sender Modal */}
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
