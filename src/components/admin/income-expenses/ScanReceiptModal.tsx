import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, Calendar as CalendarIcon, ArrowRight, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { HierarchicalCategory } from '@/hooks/useHierarchicalCategories';
import { HierarchicalCategorySelector } from '../bills-expenses/HierarchicalCategorySelector';
import { parseLocalDate } from '@/utils/dateUtils';

interface ExtractionResult {
  vendor_payee: string;
  expense_date: string;
  amount: number;
  category_id: string | null;
  category_guess: string;
  subcategory_guess: string | null;
  confidence: {
    vendor: 'high' | 'medium' | 'low';
    date: 'high' | 'medium' | 'low';
    amount: 'high' | 'medium' | 'low';
    category: 'high' | 'medium' | 'low';
  };
  expense_title: string;
  line_items?: Array<{ description: string; amount: number }>;
  raw: object;
}

interface FormData {
  expense_title: string;
  category_id: string;
  vendor_payee: string;
  expense_date: Date;
  amount: string;
  payment_status: 'paid' | 'unpaid' | 'pending';
  payment_method: string;
  notes: string;
  is_recurring: boolean;
  recurrence_frequency: string;
  start_date: Date | null;
  end_date: Date | null;
  attachmentFile: File | null;
  existingAttachmentUrl: string | null;
}

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (formData: FormData, receiptMetadata?: { raw: object; confidence: object }) => void;
  companyId: string;
}

const ConfidenceBadge = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'High' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Medium' },
    low: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Low' }
  };
  const { bg, text, border, label } = config[level];
  return (
    <Badge className={cn('text-xs font-medium border', bg, text, border)}>
      {label}
    </Badge>
  );
};

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  companyId
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'review'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Form state for review step
  const [formData, setFormData] = useState<{
    expense_title: string;
    vendor_payee: string;
    expense_date: Date;
    amount: string;
    category_id: string;
    notes: string;
    payment_status: 'paid' | 'unpaid' | 'pending';
    payment_method: string;
  }>({
    expense_title: '',
    vendor_payee: '',
    expense_date: new Date(),
    amount: '',
    category_id: '',
    notes: '',
    payment_status: 'paid',
    payment_method: ''
  });

  const resetState = useCallback(() => {
    setActiveTab('upload');
    setIsUploading(false);
    setIsExtracting(false);
    setUploadedPath(null);
    setUploadedUrl(null);
    setExtractionResult(null);
    setIsSaving(false);
    setFormData({
      expense_title: '',
      vendor_payee: '',
      expense_date: new Date(),
      amount: '',
      category_id: '',
      notes: '',
      payment_status: 'paid',
      payment_method: ''
    });
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('expense-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadedPath(fileName);

      // Get public URL for preview
      const { data: urlData } = supabase.storage
        .from('expense-attachments')
        .getPublicUrl(fileName);
      
      setUploadedUrl(urlData.publicUrl);

      toast({
        title: 'Upload Complete',
        description: 'Analyzing receipt...'
      });

      // Now extract data
      await extractReceiptData(fileName);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload receipt. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const extractReceiptData = async (attachmentPath: string) => {
    setIsExtracting(true);

    try {
      const { data, error } = await supabase.functions.invoke('receipt-extract', {
        body: {
          company_id: companyId,
          attachment_path: attachmentPath,
          transaction_type: 'expense'
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractionResult(data);

      // Pre-fill form with extracted data
      setFormData({
        expense_title: data.expense_title || 'Receipt',
        vendor_payee: data.vendor_payee || '',
        expense_date: data.expense_date ? parseLocalDate(data.expense_date) : new Date(),
        amount: data.amount?.toString() || '',
        category_id: data.category_id || '',
        notes: data.line_items?.length > 0 
          ? `Line Items:\n${data.line_items.map((item: { description: string; amount: number }) => `- ${item.description}: $${item.amount.toFixed(2)}`).join('\n')}`
          : '',
        payment_status: 'paid',
        payment_method: ''
      });

      // Switch to review tab
      setActiveTab('review');

      toast({
        title: 'Analysis Complete',
        description: 'Receipt data extracted. Please review and save.'
      });

    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze receipt',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.expense_title || !formData.amount) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in the required fields (Title and Amount)',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      // Build formData for parent's handleSubmit
      const saveData: FormData = {
        expense_title: formData.expense_title,
        vendor_payee: formData.vendor_payee,
        expense_date: formData.expense_date,
        amount: formData.amount,
        category_id: formData.category_id,
        notes: formData.notes,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        is_recurring: false,
        recurrence_frequency: 'monthly',
        start_date: null,
        end_date: null,
        attachmentFile: null,
        existingAttachmentUrl: uploadedPath
      };

      const receiptMetadata = extractionResult ? {
        raw: extractionResult.raw,
        confidence: extractionResult.confidence
      } : undefined;

      onSaveExpense(saveData, receiptMetadata);
      handleClose();

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save expense. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [companyId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-500" />
            Scan Receipt
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'review')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Receipt
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!extractionResult} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Review Details
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                isUploading || isExtracting
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-300 hover:border-amber-400 hover:bg-amber-50/50"
              )}
              onClick={() => !isUploading && !isExtracting && document.getElementById('receipt-upload')?.click()}
            >
              <input
                id="receipt-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading || isExtracting}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                  <p className="text-sm font-medium text-amber-700">Uploading receipt...</p>
                </div>
              ) : isExtracting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                  <p className="text-sm font-medium text-amber-700">Analyzing receipt with AI...</p>
                  <p className="text-xs text-slate-500">This may take a few seconds</p>
                </div>
              ) : (
                <>
                  <Camera className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-lg font-medium text-slate-700 mb-1">
                    Drop receipt here or click to upload
                  </p>
                  <p className="text-sm text-slate-500">
                    Supports JPG, PNG, HEIC • Max 10MB
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    On mobile, you can take a photo directly
                  </p>
                </>
              )}
            </div>

            {uploadedUrl && !isExtracting && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Uploaded Receipt:</p>
                <img 
                  src={uploadedUrl} 
                  alt="Receipt preview" 
                  className="max-h-48 rounded-lg border border-slate-200 shadow-sm"
                />
              </div>
            )}
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-4 mt-4">
            {extractionResult && (
              <>
                {/* Receipt Thumbnail */}
                {uploadedUrl && (
                  <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                    <img 
                      src={uploadedUrl} 
                      alt="Receipt" 
                      className="h-20 w-auto rounded border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {formData.expense_title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Review and edit the extracted data below
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid gap-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expense_title">Title *</Label>
                    </div>
                    <Input
                      id="expense_title"
                      value={formData.expense_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, expense_title: e.target.value }))}
                      placeholder="Expense title"
                    />
                  </div>

                  {/* Vendor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="vendor_payee">Vendor/Payee</Label>
                      {extractionResult.confidence.vendor && (
                        <ConfidenceBadge level={extractionResult.confidence.vendor} />
                      )}
                    </div>
                    <Input
                      id="vendor_payee"
                      value={formData.vendor_payee}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor_payee: e.target.value }))}
                      placeholder="Vendor name"
                    />
                  </div>

                  {/* Amount and Date Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Amount */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="amount">Amount *</Label>
                        {extractionResult.confidence.amount && (
                          <ConfidenceBadge level={extractionResult.confidence.amount} />
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          className="pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Date</Label>
                        {extractionResult.confidence.date && (
                          <ConfidenceBadge level={extractionResult.confidence.date} />
                        )}
                      </div>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.expense_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expense_date ? format(formData.expense_date, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.expense_date}
                            onSelect={(date) => {
                              if (date) {
                                setFormData(prev => ({ ...prev, expense_date: date }));
                                setIsDatePickerOpen(false);
                              }
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Category</Label>
                      {extractionResult.confidence.category && (
                        <ConfidenceBadge level={extractionResult.confidence.category} />
                      )}
                    </div>
                    <HierarchicalCategorySelector
                      selectedCategoryId={formData.category_id}
                      onCategoryChange={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
                      transactionType="expense"
                      insideModal={true}
                    />
                    {extractionResult.category_guess && !formData.category_id && (
                      <p className="text-xs text-amber-600">
                        AI suggested: {extractionResult.category_guess}
                        {extractionResult.subcategory_guess && ` > ${extractionResult.subcategory_guess}`}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !formData.expense_title || !formData.amount}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Expense
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
