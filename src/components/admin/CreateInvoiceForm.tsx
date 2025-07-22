
import React, { useState } from 'react';
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
import { CreateInvoiceData } from './types/invoice';
import { Plus, X, Calendar, MapPin, User, Building, Mail, Phone, Hash, FileText, DollarSign, Save, Send, Download, Paperclip } from 'lucide-react';

interface InvoiceFormData {
  title: string;
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
  const { createInvoice, isCreating } = useInvoices();
  const { data: jobsites } = useJobsites();
  const [isDraft, setIsDraft] = useState(false);
  
  const form = useForm<InvoiceFormData>({
    defaultValues: {
      title: '',
      client_company: '',
      client_email: '',
      client_address: '',
      client_phone: '',
      jobsite_id: '',
      po_number: '',
      discount: 0,
      tax: 13,
      due_date: '',
      notes: '',
      line_items: [{ name: '', description: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  const onSubmit = (data: InvoiceFormData, saveAsDraft = false) => {
    const invoiceData: CreateInvoiceData = {
      ...data,
      notes: data.notes || null,
      line_items: data.line_items.filter(item => item.description && item.quantity > 0 && item.unit_price > 0).map(item => ({
        description: `${item.name ? item.name + ' - ' : ''}${item.description}`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price
      })),
    };
    
    createInvoice(invoiceData);
    if (!saveAsDraft) {
      form.reset();
    }
  };

  const handleSaveAsDraft = () => {
    setIsDraft(true);
    form.handleSubmit((data) => onSubmit(data, true))();
  };

  const handleSendInvoice = () => {
    setIsDraft(false);
    form.handleSubmit((data) => onSubmit(data, false))();
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
    <div className="space-y-6">
      {/* Client Details Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Client Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="client_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Client Company</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Client Email</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="client@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Client Phone</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Client Address</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street, City, Province, Postal Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Invoice Metadata Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Invoice Metadata</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invoice title or project name" {...field} />
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
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Jobsite</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel className="flex items-center space-x-2">
                      <Hash className="h-4 w-4" />
                      <span>PO Number (Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Purchase order number" {...field} />
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
                    <FormLabel className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Due Date</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input type="date" {...field} />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
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
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Line Items</CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', description: '', quantity: 1, unit_price: 0 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Item Name</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Total</div>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="md:hidden">Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Item name" {...field} />
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
                          <FormLabel className="md:hidden">Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Detailed description" {...field} />
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
                          <FormLabel className="md:hidden">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="1"
                              {...field}
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
                          <FormLabel className="md:hidden">Unit Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
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
                        <span className="font-semibold text-lg">
                          ${((form.watch(`line_items.${index}.quantity`) || 0) * (form.watch(`line_items.${index}.unit_price`) || 0)).toFixed(2)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Notes and Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Payment terms, project details, or other relevant information..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
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
                        <FormLabel>Tax (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="13"
                            {...field}
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
        <Card className="shadow-sm bg-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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

      {/* Action Buttons */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <Form {...form}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isCreating}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              
              <Button
                type="button"
                onClick={handleSendInvoice}
                disabled={isCreating}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating Invoice...' : 'Send Invoice'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled
                className="flex-1"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateInvoiceForm;
