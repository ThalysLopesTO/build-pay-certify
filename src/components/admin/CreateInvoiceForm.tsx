
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices } from '@/hooks/useInvoices';
import { useJobsites } from '@/hooks/useJobsites';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { CreateInvoiceData, Invoice } from './types/invoice';
import { autoSendInvoiceEmail } from '@/utils/autoSendInvoiceEmail';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Copy, Calendar, MapPin, User, Building, Mail, Phone, Hash, FileText, DollarSign, Save, Send, Download, Paperclip } from 'lucide-react';
import ClientSelector from './quotes/editor/ClientSelector';
import type { Client } from '@/hooks/useClients';
import { useIsMobile } from '@/hooks/use-mobile';
import InvoiceMobileLineItem from './invoices/InvoiceMobileLineItem';

interface InvoiceFormData {
  title: string;
  client_id: string;
  client_company: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  jobsite_id: string;
  po_number: string;
  discount: number;
  tax: number;
  due_date: string;
  notes: string;
  line_items: { 
    name: string;
    description: string; 
    quantity: number;
    unit_price: number;
  }[];
}

const CreateInvoiceForm = () => {
  const { createInvoiceMutation, isCreating } = useInvoices();
  const { data: jobsites } = useJobsites();
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { toast } = useToast();
  const [isDraft, setIsDraft] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const isMobile = useIsMobile();
  
  const form = useForm<InvoiceFormData>({
    defaultValues: {
      title: '',
      client_id: '',
      client_company: '',
      client_email: '',
      client_address: '',
      client_phone: '',
      jobsite_id: '',
      po_number: '',
      discount: 0,
      tax: settings?.tax_percentage || 13,
      due_date: '',
      notes: '',
      line_items: [{ name: '', description: '', quantity: 1, unit_price: 0 }],
    },
  });

  // Update tax when company settings load
  useEffect(() => {
    if (settings?.tax_percentage !== undefined) {
      form.setValue('tax', settings.tax_percentage);
    }
  }, [settings?.tax_percentage, form]);

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const client = selectedClient;
    if (client && client.id === clientId) {
      form.setValue('client_id', client.id);
      form.setValue('client_company', client.client_company || '');
      form.setValue('client_email', client.client_email);
      form.setValue('client_phone', client.client_phone || '');
      form.setValue('client_address', client.client_address || '');
    }
  };

  const handleClientChange = (client: Client) => {
    setSelectedClient(client);
    form.setValue('client_id', client.id);
    form.setValue('client_company', client.client_company || '');
    form.setValue('client_email', client.client_email);
    form.setValue('client_phone', client.client_phone || '');
    form.setValue('client_address', client.client_address || '');
  };

  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  const onSubmit = async (data: InvoiceFormData, saveAsDraft = false, sendEmailFlag = false) => {
    // Validate client selection
    if (!data.client_id) {
      toast({
        title: 'Client Required',
        description: 'Please select a client before creating the invoice',
        variant: 'destructive',
      });
      return;
    }

    const invoiceData: CreateInvoiceData & { sendEmail?: boolean } = {
      ...data,
      invoice_number: data.po_number?.trim() || undefined,
      client_id: data.client_id,
      notes: data.notes || null,
      line_items: data.line_items.filter(item => item.description && item.quantity > 0 && item.unit_price > 0).map(item => ({
        description: `${item.name ? item.name + ' - ' : ''}${item.description}`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price
      })),
      sendEmail: sendEmailFlag,
    };
    
    createInvoiceMutation.mutate(invoiceData as any, {
      onSuccess: async (createdInvoice: any) => {
        // If this was a "Send Invoice" action, auto-send email
        if (sendEmailFlag && createdInvoice._shouldSendEmail) {
          setIsSendingEmail(true);
          
          toast({
            title: 'Invoice Created',
            description: `Sending email to ${data.client_email}...`,
          });

          const emailResult = await autoSendInvoiceEmail(
            createdInvoice as Invoice,
            settings,
            logoUrl
          );

          setIsSendingEmail(false);

          if (emailResult.success) {
            toast({
              title: 'Invoice Sent Successfully',
              description: `Invoice #${createdInvoice.invoice_number} has been created and emailed to ${data.client_email}`,
            });
          } else {
            toast({
              title: 'Invoice Created',
              description: `Invoice #${createdInvoice.invoice_number} created but email failed: ${emailResult.error}. You can resend from Invoice Tracker.`,
              variant: 'default',
            });
          }
        }
      }
    });
    
    if (!saveAsDraft) {
      form.reset();
    }
  };

  const handleSaveAsDraft = () => {
    setIsDraft(true);
    form.handleSubmit((data) => onSubmit(data, true, false))();
  };

  const handleSendInvoice = () => {
    setIsDraft(false);
    form.handleSubmit((data) => onSubmit(data, false, true))();
  };

  const calculateSubtotal = () => {
    const lineItems = form.watch('line_items');
    return lineItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = form.watch('discount') || 0;
    const tax = form.watch('tax') || 0;
    
    const discountAmount = subtotal * (discount / 100);
    const taxAmount = (subtotal - discountAmount) * (tax / 100);
    
    return subtotal - discountAmount + taxAmount;
  };

  const generateDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={`space-y-4 md:space-y-8 max-w-7xl mx-auto ${isMobile ? 'px-0 pb-32' : 'p-6'}`}>
      {/* Client Details Section */}
      <Card className={`shadow-xl border-0 bg-gradient-to-r from-background to-muted/20 overflow-hidden ${isMobile ? 'rounded-none border-x-0' : ''}`}>
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-blue-200/30">
          <CardHeader className={`pb-4 ${isMobile ? 'px-4 py-3' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-xl'}`}>Client Details</CardTitle>
                {!isMobile && <p className="text-sm text-muted-foreground mt-1">Enter your client's information for billing purposes</p>}
              </div>
            </div>
          </CardHeader>
        </div>
        <CardContent className={isMobile ? 'p-4' : 'p-8'}>
          <ClientSelector
            selectedClientId={form.watch('client_id')}
            onClientSelect={handleClientChange}
          />
        </CardContent>
      </Card>

      {/* Invoice Metadata Section */}
      <Card className={`shadow-xl border-0 bg-gradient-to-r from-background to-muted/20 overflow-hidden ${isMobile ? 'rounded-none border-x-0' : ''}`}>
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-b border-green-200/30">
          <CardHeader className={`pb-4 ${isMobile ? 'px-4 py-3' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-xl'}`}>Invoice Metadata</CardTitle>
                {!isMobile && <p className="text-sm text-muted-foreground mt-1">Configure invoice details and project information</p>}
              </div>
            </div>
          </CardHeader>
        </div>
        <CardContent className={isMobile ? 'p-4' : 'p-8'}>
          <Form {...form}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 ${isMobile ? 'gap-4' : 'gap-8'}`}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Invoice Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter invoice title or project name" 
                        className="h-12 border-2 border-border/50 focus:border-green-500 rounded-xl transition-all duration-200 bg-background/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobsite_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>Jobsite</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-2 border-border/50 focus:border-green-500 rounded-xl transition-all duration-200 bg-background/50">
                          <SelectValue placeholder="Select a jobsite" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobsites?.map((jobsite) => (
                          <SelectItem key={jobsite.id} value={jobsite.id}>
                            {jobsite.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="po_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                      <Hash className="h-4 w-4 text-green-500" />
                      <span>PO / Invoice Number (Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Purchase order number" 
                        className="h-12 border-2 border-border/50 focus:border-green-500 rounded-xl transition-all duration-200 bg-background/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-sm font-medium text-foreground">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span>Due Date</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex space-x-3">
                        <Input 
                          type="date" 
                          className="h-12 border-2 border-border/50 focus:border-green-500 rounded-xl transition-all duration-200 bg-background/50" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="h-12 px-4 border-2 border-border/50 hover:border-green-500 rounded-xl transition-all duration-200"
                          onClick={() => form.setValue('due_date', generateDueDate())}
                        >
                          +30 Days
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Line Items Section */}
      <Card className={`shadow-xl border-0 bg-gradient-to-r from-background to-muted/20 overflow-hidden ${isMobile ? 'rounded-none border-x-0' : ''}`}>
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-b border-purple-200/30">
          <CardHeader className={`pb-4 ${isMobile ? 'px-4 py-3' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-xl'}`}>Line Items</CardTitle>
                  {!isMobile && <p className="text-sm text-muted-foreground mt-1">Add products or services to invoice</p>}
                </div>
              </div>
              {!isMobile && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-400 rounded-xl transition-all duration-200 shadow-md"
                  onClick={() => append({ name: '', description: '', quantity: 1, unit_price: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
          </CardHeader>
        </div>
        <CardContent className={isMobile ? 'p-4' : 'p-8'}>
          <Form {...form}>
            <div className="space-y-4 md:space-y-6">
              {/* Mobile Line Items */}
              {isMobile ? (
                <>
                  {fields.map((field, index) => (
                    <InvoiceMobileLineItem
                      key={field.id}
                      index={index}
                      form={form}
                      onRemove={() => remove(index)}
                      canRemove={fields.length > 1}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: '', description: '', quantity: 1, unit_price: 0 })}
                    className="w-full h-12 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </>
              ) : (
                <>
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid md:grid-cols-12 gap-6 pb-4 border-b-2 border-border/30 text-sm font-semibold text-foreground">
                    <div className="col-span-2">Item Name</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Total</div>
                  </div>

                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-6 bg-gradient-to-r from-background to-muted/10 border-2 border-border/20 shadow-lg rounded-xl hover:shadow-xl transition-all duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="md:hidden text-sm font-medium">Item Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Item name" 
                              className="h-11 border-2 border-border/50 focus:border-purple-500 rounded-lg transition-all duration-200" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`line_items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-4">
                          <FormLabel className="md:hidden text-sm font-medium">Description</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Detailed description" 
                              className="h-11 border-2 border-border/50 focus:border-purple-500 rounded-lg transition-all duration-200" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`line_items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="md:hidden text-sm font-medium">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="1"
                              className="h-11 border-2 border-border/50 focus:border-purple-500 rounded-lg transition-all duration-200"
                              {...field}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`line_items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="md:hidden text-sm font-medium">Unit Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-11 border-2 border-border/50 focus:border-purple-500 rounded-lg transition-all duration-200"
                              {...field}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium md:hidden">Total: </span>
                        <span className="font-bold text-xl text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                          ${((form.watch(`line_items.${index}.quantity`) || 0) * (form.watch(`line_items.${index}.unit_price`) || 0)).toFixed(2)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-destructive hover:text-destructive hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
                  ))}
                </>
              )}
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Notes and Summary Section */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${isMobile ? 'gap-4' : 'gap-8'}`}>
        {/* Notes */}
        <Card className={`shadow-xl border-0 bg-gradient-to-br from-background to-muted/20 overflow-hidden ${isMobile ? 'rounded-none border-x-0' : ''}`}>
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-amber-200/30">
            <CardHeader className={`pb-4 ${isMobile ? 'px-4 py-3' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-xl'}`}>Additional Info</CardTitle>
                  {!isMobile && <p className="text-sm text-muted-foreground mt-1">Notes and adjustments</p>}
                </div>
              </div>
            </CardHeader>
          </div>
          <CardContent className={isMobile ? 'p-4' : 'p-6'}>
            <Form {...form}>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Payment terms, project details, or other relevant information..."
                          rows={4}
                          className="border-2 border-border/50 focus:border-amber-500 rounded-xl transition-all duration-200 bg-background/50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Discount (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            className="h-11 border-2 border-border/50 focus:border-amber-500 rounded-xl transition-all duration-200 bg-background/50"
                            {...field}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Tax (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="13"
                            className="h-11 border-2 border-border/50 focus:border-amber-500 rounded-xl transition-all duration-200 bg-background/50"
                            {...field}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card className={`shadow-xl border-0 bg-slate-50 dark:bg-slate-100 overflow-hidden ${isMobile ? 'rounded-none border-x-0' : ''}`}>
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-b border-emerald-200/50">
            <CardHeader className={`pb-4 ${isMobile ? 'px-4 py-3' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-xl'}`}>Invoice Summary</CardTitle>
                  {!isMobile && <p className="text-sm text-muted-foreground mt-1">Review totals and calculations</p>}
                </div>
              </div>
            </CardHeader>
          </div>
          <CardContent className={`bg-slate-50 dark:bg-slate-100 ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="space-y-4">
              <div className="flex justify-between text-base">
                <span>Subtotal:</span>
                <span className="font-mono">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span>Discount ({form.watch('discount')}%):</span>
                <span className="font-mono text-red-600">-${(calculateSubtotal() * (form.watch('discount') / 100)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span>Tax ({form.watch('tax')}%):</span>
                <span className="font-mono">${((calculateSubtotal() - (calculateSubtotal() * (form.watch('discount') / 100))) * (form.watch('tax') / 100)).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-xl">
                  <span>Total:</span>
                  <span className="font-mono text-primary">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Action Buttons */}
      {!isMobile && (
        <Card className="shadow-xl border-0 bg-gradient-to-r from-background to-muted/10 overflow-hidden">
          <CardContent className="p-8">
            <Form {...form}>
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Secondary Actions */}
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveAsDraft}
                    disabled={isCreating}
                    className="flex-1 h-14 text-base font-medium border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all duration-200 shadow-md"
                  >
                    <Save className="h-5 w-5 mr-3" />
                    Save as Draft
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="flex-1 h-14 text-base font-medium border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all duration-200 shadow-md"
                  >
                    <Download className="h-5 w-5 mr-3" />
                    Download PDF
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="flex-1 h-14 text-base font-medium border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl transition-all duration-200 shadow-md"
                  >
                    <Paperclip className="h-5 w-5 mr-3" />
                    Attach Files
                  </Button>
                </div>
                
                {/* Primary Action */}
                <Button
                  type="button"
                  onClick={handleSendInvoice}
                  disabled={isCreating || isSendingEmail}
                  className="sm:flex-1 sm:max-w-xs h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Send className="h-5 w-5 mr-3" />
                  {isCreating ? 'Creating Invoice...' : isSendingEmail ? 'Sending Email...' : 'Send Invoice'}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Mobile Sticky Action Buttons */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t shadow-lg safe-bottom">
          <div className="px-4 py-3 space-y-2">
            <Button
              type="button"
              onClick={handleSendInvoice}
              disabled={isCreating || isSendingEmail}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              <Send className="h-5 w-5 mr-2" />
              {isCreating ? 'Creating...' : isSendingEmail ? 'Sending...' : 'Send Invoice'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isCreating}
                className="h-11"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled
                className="h-11"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoiceForm;
