import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useEmailTemplates, useEmailTemplate, useCreateEmailTemplate, useUpdateEmailTemplate, getDefaultTemplate, replacePlaceholders } from '@/hooks/useEmailTemplates';
import { createEmailWrapper } from '@/utils/emailTemplate';
import { useToast } from '@/hooks/use-toast';
import { Mail, Eye, Save, RotateCcw, Info, Copy } from 'lucide-react';

const EmailTemplatesTab = () => {
  const { templates, isLoading } = useEmailTemplates();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState<'invoice' | 'quote' | 'invite' | 'welcome' | 'reminder'>('quote');
  const [selectedStage, setSelectedStage] = useState<'general' | 'before_due' | 'overdue' | 'follow_up'>('general');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');

  const { template: currentTemplate } = useEmailTemplate(selectedType, selectedStage);

  React.useEffect(() => {
    if (currentTemplate) {
      setSubject(currentTemplate.subject);
      setBodyText(currentTemplate.body_html || '');
    } else {
      const defaultTemplate = getDefaultTemplate(selectedType, selectedStage);
      setSubject(defaultTemplate.subject);
      setBodyText(defaultTemplate.body_html || '');
    }
  }, [currentTemplate, selectedType, selectedStage]);

  const handleSave = async () => {
    const templateData = {
      template_type: selectedType,
      subject,
      body_html: bodyText,
      reminder_stage: selectedStage,
    };

    try {
      if (currentTemplate) {
        await updateTemplate.mutateAsync({
          id: currentTemplate.id,
          updates: templateData,
        });
      } else {
        await createTemplate.mutateAsync(templateData);
      }
      toast({
        title: "Template saved",
        description: "Your email template has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    const defaultTemplate = getDefaultTemplate(selectedType, selectedStage);
    setSubject(defaultTemplate.subject);
    setBodyText(defaultTemplate.body_html || '');
  };

  const handleCopyPlaceholder = async (placeholder: string) => {
    await navigator.clipboard.writeText(placeholder);
    toast({
      title: "Copied",
      description: `${placeholder} copied to clipboard`,
    });
  };

  const generatePreview = () => {
    const sampleData = {
      client_name: 'John Smith',
      client_company: 'ABC Construction',
      company_name: 'Your Company Name',
      company_address: '123 Main St, City, State 12345',
      company_phone: '(555) 123-4567',
      company_logo: 'https://via.placeholder.com/200x80/0066cc/ffffff?text=Your+Logo',
      quote_number: 'QUO-0001',
      invoice_number: 'INV-0001',
      project_name: 'Sample Construction Project',
      total_amount: '15,500.00',
      due_date: 'March 15, 2024',
      expiry_date: 'February 15, 2024',
      hst_number: 'HST123456789',
      custom_message: 'Thank you for your business!',
    };

    // Replace placeholders in the plain text
    const processedSubject = replacePlaceholders(subject, sampleData);
    const processedBodyText = replacePlaceholders(bodyText, sampleData);

    // Create the branded HTML email
    const brandedHtml = createEmailWrapper({
      subject: processedSubject,
      bodyText: processedBodyText,
      companyName: sampleData.company_name,
      companyAddress: sampleData.company_address,
      companyPhone: sampleData.company_phone,
      companyLogo: sampleData.company_logo,
    });

    return {
      subject: processedSubject,
      body: brandedHtml,
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
    '{{company_address}}', '{{company_phone}}', '{{company_logo}}',
    '{{quote_number}}', '{{invoice_number}}', '{{project_name}}', 
    '{{total_amount}}', '{{due_date}}', '{{expiry_date}}', 
    '{{hst_number}}', '{{custom_message}}'
  ];

  if (isLoading) {
    return <div className="p-6">Loading templates...</div>;
  }

  const preview = generatePreview();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </h3>
          <p className="text-muted-foreground">
            Create and manage custom email templates for quotes, invoices, and system communications.
          </p>
        </div>

        {/* Card 1: Template Selection */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-base">Template Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Type */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Template Type</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose the type of email template you want to create or edit</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger className="w-full rounded-lg">
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
            </div>

            {/* Reminder Stage */}
            {(selectedType === 'invoice' || selectedType === 'quote') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Reminder Stage</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the specific stage for multi-stage reminder campaigns</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={selectedStage} 
                  onValueChange={(value: any) => setSelectedStage(value)}
                >
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex flex-col">
                        <span>General</span>
                        <span className="text-xs text-muted-foreground">Standard email template</span>
                      </div>
                    </SelectItem>
                    {selectedType === 'invoice' && (
                      <>
                        <SelectItem value="before_due">
                          <div className="flex flex-col">
                            <span>Before Due</span>
                            <span className="text-xs text-muted-foreground">Friendly reminder before due date</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="overdue">
                          <div className="flex flex-col">
                            <span>Overdue</span>
                            <span className="text-xs text-muted-foreground">Urgent notice for overdue invoices</span>
                          </div>
                        </SelectItem>
                      </>
                    )}
                    {selectedType === 'quote' && (
                      <SelectItem value="follow_up">
                        <div className="flex flex-col">
                          <span>Follow Up</span>
                          <span className="text-xs text-muted-foreground">Follow-up reminder for quotes</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Status Badges */}
            <div className="flex items-center gap-2">
              {currentTemplate ? (
                <Badge variant="secondary">Custom Template</Badge>
              ) : (
                <Badge variant="outline">Using Default Template</Badge>
              )}
              {(selectedType === 'invoice' || selectedType === 'quote') && selectedStage !== 'general' && (
                <Badge variant="default">{selectedStage.replace('_', ' ').toUpperCase()}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 2: Template Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base">Email Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject line..."
                  className="text-base p-4 rounded-lg"
                />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base">Email Body</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={16}
                  className="rounded-lg border-2 p-4 resize-none leading-relaxed"
                  placeholder="Type your email message here. Use placeholders like {{client_name}} to personalize emails. Your text will be automatically formatted into a professional HTML email."
                />
              </CardContent>
            </Card>
          </div>

          {/* Variables Helper */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Dynamic Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to insert placeholders:
                </p>
                <div className="space-y-2">
                  {availablePlaceholders.map((placeholder) => (
                    <button
                      key={placeholder}
                      onClick={() => handleCopyPlaceholder(placeholder)}
                      className="block w-full text-left px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg font-mono transition-colors border border-border/50"
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Card 3: Actions */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleSave} 
                disabled={createTemplate.isPending || updateTemplate.isPending}
                className="flex items-center gap-2"
                size="lg"
              >
                <Save className="h-4 w-4" />
                Save Template
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Email Preview</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Subject:</Label>
                      <div className="mt-1 p-3 bg-muted rounded-lg text-sm">
                        {preview.subject}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Body:</Label>
                      <div 
                        className="mt-1 p-4 bg-background border rounded-lg max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: preview.body }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="lg" className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset to Default
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore the default template content. Any custom changes will be lost. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Reset Template
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default EmailTemplatesTab;