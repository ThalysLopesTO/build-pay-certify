import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEmailTemplates, useEmailTemplate, useCreateEmailTemplate, useUpdateEmailTemplate, getDefaultTemplate, replacePlaceholders } from '@/hooks/useEmailTemplates';
import { Mail, Eye, Save, Plus, RotateCcw } from 'lucide-react';

const EmailTemplatesTab = () => {
  const { templates, isLoading } = useEmailTemplates();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  
  const [selectedType, setSelectedType] = useState<'invoice' | 'quote' | 'invite' | 'welcome' | 'reminder'>('quote');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { template: currentTemplate } = useEmailTemplate(selectedType);

  React.useEffect(() => {
    if (currentTemplate) {
      setSubject(currentTemplate.subject);
      setBodyHtml(currentTemplate.body_html);
    } else {
      const defaultTemplate = getDefaultTemplate(selectedType);
      setSubject(defaultTemplate.subject);
      setBodyHtml(defaultTemplate.body_html);
    }
  }, [currentTemplate, selectedType]);

  const handleSave = async () => {
    const templateData = {
      template_type: selectedType,
      subject,
      body_html: bodyHtml,
    };

    if (currentTemplate) {
      await updateTemplate.mutateAsync({
        id: currentTemplate.id,
        updates: templateData,
      });
    } else {
      await createTemplate.mutateAsync(templateData);
    }
  };

  const handleReset = () => {
    const defaultTemplate = getDefaultTemplate(selectedType);
    setSubject(defaultTemplate.subject);
    setBodyHtml(defaultTemplate.body_html);
  };

  const generatePreview = () => {
    const sampleData = {
      client_name: 'John Smith',
      client_company: 'ABC Construction',
      company_name: 'Your Company Name',
      company_address: '123 Main St, City, State 12345',
      company_phone: '(555) 123-4567',
      quote_number: 'QUO-0001',
      invoice_number: 'INV-0001',
      project_name: 'Sample Construction Project',
      total_amount: '15,500.00',
      due_date: 'March 15, 2024',
      expiry_date: 'February 15, 2024',
      hst_number: 'HST123456789',
      custom_message: 'Thank you for your business!',
    };

    return {
      subject: replacePlaceholders(subject, sampleData),
      body: replacePlaceholders(bodyHtml, sampleData),
    };
  };

  const templateTypes = [
    { value: 'quote', label: 'Quote Templates', description: 'Emails sent with quotes to clients' },
    { value: 'invoice', label: 'Invoice Templates', description: 'Emails sent with invoices to clients' },
    { value: 'invite', label: 'Employee Invites', description: 'Welcome emails for new employees' },
    { value: 'welcome', label: 'Welcome Messages', description: 'Onboarding emails for new users' },
    { value: 'reminder', label: 'Payment Reminders', description: 'Automated payment reminder emails' },
  ];

  const availablePlaceholders = [
    '{{client_name}}', '{{client_company}}', '{{company_name}}',
    '{{company_address}}', '{{company_phone}}', '{{quote_number}}',
    '{{invoice_number}}', '{{project_name}}', '{{total_amount}}',
    '{{due_date}}', '{{expiry_date}}', '{{hst_number}}', '{{custom_message}}'
  ];

  if (isLoading) {
    return <div className="p-6">Loading templates...</div>;
  }

  const preview = generatePreview();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Templates
        </h3>
        <p className="text-muted-foreground">
          Create and manage custom email templates for quotes, invoices, and system communications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templateTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="mt-2 flex items-center gap-2">
            {currentTemplate ? (
              <Badge variant="secondary">Custom Template</Badge>
            ) : (
              <Badge variant="outline">Using Default Template</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={showPreview ? "preview" : "edit"} onValueChange={(value) => setShowPreview(value === "preview")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit Template</TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subject Line</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Body (HTML)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="Enter email HTML content..."
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={createTemplate.isPending || updateTemplate.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Default
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Placeholders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click to copy to clipboard:
                  </p>
                  <div className="space-y-1">
                    {availablePlaceholders.map((placeholder) => (
                      <button
                        key={placeholder}
                        onClick={() => navigator.clipboard.writeText(placeholder)}
                        className="block w-full text-left px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded font-mono"
                      >
                        {placeholder}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                This is how your email will look with sample data
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subject:</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm">
                  {preview.subject}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium">Body:</Label>
                <div 
                  className="mt-1 p-4 bg-white border rounded max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview.body }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailTemplatesTab;