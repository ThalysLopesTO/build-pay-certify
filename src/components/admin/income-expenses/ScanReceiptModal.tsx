import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Upload, Camera, Loader2, CheckCircle, Calendar as CalendarIcon, Save, TrendingDown, TrendingUp, FileCheck, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format, subDays, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { HierarchicalCategorySelector } from '../bills-expenses/HierarchicalCategorySelector';
import { parseLocalDate, formatDateForDB } from '@/utils/dateUtils';
import { DuplicateWarningPanel } from './DuplicateWarningPanel';
import { DuplicateCandidate, DuplicateDecision, DuplicateInfo, ExtractionResultWithDetected } from '@/types/duplicate-detection';
import { computeFileHash, calculateDuplicateScore, DUPLICATE_SCORE_THRESHOLD, BLOCKING_SCORE_THRESHOLD } from '@/utils/duplicateDetection';

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
  onSaveExpense: (
    formData: FormData, 
    receiptMetadata?: { raw: object; confidence: object },
    duplicateInfo?: DuplicateInfo,
    transactionType?: 'income' | 'expense'
  ) => void;
  companyId: string;
  onOpenTransaction?: (id: string) => void;
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
  companyId,
  onOpenTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'select-type' | 'upload' | 'review'>('select-type');
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResultWithDetected | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Duplicate detection state
  const [receiptHash, setReceiptHash] = useState<string | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateDecision, setDuplicateDecision] = useState<DuplicateDecision | null>(null);

  // Upload error state for mobile recovery
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Mobile detection
  const isMobile = useIsMobile();

  // Transaction type state - now set BEFORE upload
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | null>(null);
  const [transactionTypeConfidence, setTransactionTypeConfidence] = useState<'high' | 'medium' | 'low' | null>(null);

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

  // iOS PWA viewport recovery - fixes blank screen after camera
  const recoverViewport = useCallback(() => {
    // Force a repaint/reflow to fix iOS viewport issues
    window.scrollTo(0, 0);
    document.body.style.overflow = 'auto';
    setTimeout(() => {
      document.body.style.overflow = '';
      // Force repaint by reading a layout property
      void document.body.offsetHeight;
    }, 100);
  }, []);

  const resetState = useCallback(() => {
    setActiveTab('select-type');
    setIsUploading(false);
    setIsExtracting(false);
    setUploadedPath(null);
    setUploadedUrl(null);
    setExtractionResult(null);
    setIsSaving(false);
    setReceiptHash(null);
    setDuplicateCandidates([]);
    setDuplicateDecision(null);
    setTransactionType(null);
    setTransactionTypeConfidence(null);
    setUploadError(null);
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

  // Handler for type selection in step 1
  const handleTypeSelectAndContinue = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setActiveTab('upload');
  };

  // Check for duplicates when form data changes
  const checkForDuplicates = useCallback(async (
    amount: number,
    date: string,
    vendor: string,
    hash: string | null
  ) => {
    if (!companyId || amount <= 0 || !transactionType) return;

    setIsCheckingDuplicates(true);
    try {
      // Calculate date range for heuristic matching
      const targetDate = parseLocalDate(date);
      const startDate = formatDateForDB(subDays(targetDate, 1));
      const endDate = formatDateForDB(addDays(targetDate, 1));

      // Build query for potential duplicates
      let query = supabase
        .from('bills_expenses')
        .select('id, expense_title, vendor_payee, expense_date, amount, category_id, attachment_url, created_at, receipt_hash')
        .eq('company_id', companyId)
        .eq('transaction_type', transactionType);

      // Add date range filter
      query = query.gte('expense_date', startDate).lte('expense_date', endDate);

      // Also check for hash match if available
      if (hash) {
        // We need to do an OR query, but supabase doesn't support complex OR well
        // So we'll do two queries and merge results
        const { data: hashMatches } = await supabase
          .from('bills_expenses')
          .select('id, expense_title, vendor_payee, expense_date, amount, category_id, attachment_url, created_at, receipt_hash')
          .eq('company_id', companyId)
          .eq('transaction_type', transactionType)
          .eq('receipt_hash', hash)
          .limit(5);

        const { data: heuristicMatches } = await query.limit(10);

        // Merge and deduplicate
        const allMatches = [...(hashMatches || []), ...(heuristicMatches || [])];
        const uniqueMatches = allMatches.reduce((acc, item) => {
          if (!acc.find(x => x.id === item.id)) {
            acc.push(item);
          }
          return acc;
        }, [] as typeof allMatches);

        // Score and filter candidates
        const scoredCandidates: DuplicateCandidate[] = uniqueMatches
          .map(candidate => ({
            ...candidate,
            score: calculateDuplicateScore(candidate, amount, date, vendor, hash)
          }))
          .filter(c => c.score > DUPLICATE_SCORE_THRESHOLD)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setDuplicateCandidates(scoredCandidates);
      } else {
        const { data } = await query.limit(10);

        // Score and filter candidates
        const scoredCandidates: DuplicateCandidate[] = (data || [])
          .map(candidate => ({
            ...candidate,
            score: calculateDuplicateScore(candidate, amount, date, vendor, hash)
          }))
          .filter(c => c.score > DUPLICATE_SCORE_THRESHOLD)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setDuplicateCandidates(scoredCandidates);
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, [companyId, transactionType]);

  // Check for duplicates when extraction completes or form fields change
  useEffect(() => {
    if (activeTab === 'review' && extractionResult) {
      const amount = parseFloat(formData.amount) || 0;
      const date = formatDateForDB(formData.expense_date);
      const vendor = formData.vendor_payee;

      // Debounce the check
      const timer = setTimeout(() => {
        checkForDuplicates(amount, date, vendor, receiptHash);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [activeTab, formData.amount, formData.expense_date, formData.vendor_payee, receiptHash, extractionResult, checkForDuplicates]);

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
      // Compute file hash for duplicate detection
      const hash = await computeFileHash(file);
      setReceiptHash(hash);

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
      setUploadError('Failed to upload receipt. Please try again.');
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload receipt. Please try again.',
        variant: 'destructive'
      });
      setIsUploading(false);
      setIsExtracting(false);
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
          transaction_type: transactionType // Pass pre-selected type
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractionResult(data);

      // Keep the user-selected transaction type, but note AI's detection
      // Don't override the user's selection - they chose before upload
      if (data.transaction_type_confidence) {
        setTransactionTypeConfidence(data.transaction_type_confidence);
      }

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
      setUploadError(error instanceof Error ? error.message : 'Failed to analyze receipt. Please try again.');
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze receipt',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Duplicate decision handlers
  const handleOpenExisting = (id: string) => {
    if (onOpenTransaction) {
      onOpenTransaction(id);
      handleClose();
    }
  };

  const handleMarkAsDuplicate = (candidateId: string) => {
    setDuplicateDecision({
      status: 'confirmed',
      duplicateOfId: candidateId
    });
  };

  const handleTransactionTypeChange = (type: 'income' | 'expense') => {
    setTransactionType(type);
    // Clear category when type changes since categories are type-specific
    setFormData(prev => ({ ...prev, category_id: '' }));
    // Reset duplicate candidates since they're type-specific
    setDuplicateCandidates([]);
    setDuplicateDecision(null);
  };

  const handleNotADuplicate = () => {
    setDuplicateDecision({
      status: 'ignored',
      duplicateOfId: null
    });
  };

  // Check if save should be blocked
  const isSaveBlocked = duplicateCandidates.some(c => c.score >= BLOCKING_SCORE_THRESHOLD) && !duplicateDecision;

  const handleSave = async () => {
    // Prevent double-click
    if (isSaving) return;

    if (!formData.expense_title || !formData.amount) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in the required fields (Title and Amount)',
        variant: 'destructive'
      });
      return;
    }

    // Block save if there's a high-confidence duplicate without decision
    if (isSaveBlocked) {
      toast({
        title: 'Duplicate Decision Required',
        description: 'Please review the duplicate warning and make a decision before saving.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    toast({
      title: 'Saving...',
      description: `Creating ${transactionType} from receipt`
    });

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

      // Build duplicate info
      const duplicateInfo: DuplicateInfo = {
        receiptHash: receiptHash,
        vendorDetected: extractionResult?.vendor_detected || extractionResult?.vendor_payee || '',
        dateDetected: extractionResult?.date_detected || extractionResult?.expense_date || formatDateForDB(new Date()),
        amountDetected: extractionResult?.amount_detected || extractionResult?.amount || 0,
        categoryDetectedId: extractionResult?.category_detected_id || extractionResult?.category_id || null,
        duplicateStatus: duplicateDecision?.status || 'none',
        duplicateOfId: duplicateDecision?.duplicateOfId || null,
        duplicateCandidates: duplicateCandidates
      };

      onSaveExpense(saveData, receiptMetadata, duplicateInfo, transactionType || 'expense');
      handleClose();

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save. Please try again.',
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
  }, [companyId, transactionType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // iOS PWA viewport recovery - call immediately when returning from camera
    recoverViewport();
    
    // Clear any previous error
    setUploadError(null);
    
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    
    // Reset input to allow re-selecting same file
    e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Prevent auto focus on mobile to avoid keyboard issues and iOS quirks
          if (isMobile) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent closing when interacting with camera/file picker
          if (isUploading || isExtracting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-500" />
            Scan Receipt
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'select-type' | 'upload' | 'review')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select-type" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Select Type</span>
              <span className="sm:hidden">Type</span>
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={!transactionType} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!extractionResult} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Select Type Tab */}
          <TabsContent value="select-type" className="space-y-6 mt-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                What are you scanning?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select the type of document to help with processing
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expense Card */}
              <button
                type="button"
                onClick={() => handleTypeSelectAndContinue('expense')}
                className={cn(
                  "flex flex-col items-center p-6 rounded-xl border-2 transition-all group",
                  "border-border hover:border-destructive hover:bg-destructive/5"
                )}
              >
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                  <TrendingDown className="h-7 w-7 text-destructive" />
                </div>
                <span className="font-semibold text-lg mt-3 text-foreground">Expense</span>
                <span className="text-sm text-muted-foreground text-center mt-1">
                  Receipt, bill, purchase
                </span>
                <div className="mt-3 text-xs text-muted-foreground/70 text-center">
                  Store receipts, utility bills, supplier invoices
                </div>
              </button>

              {/* Income Card */}
              <button
                type="button"
                onClick={() => handleTypeSelectAndContinue('income')}
                className={cn(
                  "flex flex-col items-center p-6 rounded-xl border-2 transition-all group",
                  "border-border hover:border-green-500 hover:bg-green-50/50"
                )}
              >
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="h-7 w-7 text-green-600" />
                </div>
                <span className="font-semibold text-lg mt-3 text-foreground">Income</span>
                <span className="text-sm text-muted-foreground text-center mt-1">
                  Invoice sent, payment received
                </span>
                <div className="mt-3 text-xs text-muted-foreground/70 text-center">
                  Client invoices, payment slips, sales receipts
                </div>
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Click to select and continue
            </p>
          </TabsContent>

          {/* Step 2: Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            {/* Type indicator at top */}
            {transactionType && (
              <div className="flex items-center justify-center gap-2 mb-4 p-2 rounded-lg bg-muted">
                {transactionType === 'expense' ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Scanning an Expense</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Scanning an Income</span>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab('select-type')}
                  className="text-xs h-6 px-2"
                >
                  Change
                </Button>
              </div>
            )}

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                isUploading || isExtracting
                  ? "border-amber-300 bg-amber-50"
                  : "border-border hover:border-amber-400 hover:bg-amber-50/50"
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
                  <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                </div>
              ) : (
                <>
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-foreground mb-1">
                    Drop receipt here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG, HEIC • Max 10MB
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    On mobile, you can take a photo directly
                  </p>
                </>
              )}
            </div>

              {/* Error state with retry option */}
              {uploadError && !isUploading && !isExtracting && (
                <div className="text-center py-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium mb-3">{uploadError}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUploadError(null);
                      recoverViewport();
                      document.getElementById('receipt-upload')?.click();
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {uploadedUrl && !isExtracting && !uploadError && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Uploaded Receipt:</p>
                  <img 
                    src={uploadedUrl} 
                    alt="Receipt preview" 
                    className="max-h-48 rounded-lg border border-border shadow-sm"
                  />
                </div>
              )}
          </TabsContent>

          {/* Step 3: Review Tab */}
          <TabsContent value="review" className="space-y-4 mt-4">
            {extractionResult && (
              <>
                {/* Receipt Thumbnail */}
                {uploadedUrl && (
                  <div className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                    <img 
                      src={uploadedUrl} 
                      alt="Receipt" 
                      className="h-20 w-auto rounded border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {formData.expense_title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Review and edit the extracted data below
                      </p>
                    </div>
                  </div>
                )}

                {/* Duplicate Warning Panel */}
                {(duplicateCandidates.length > 0 || isCheckingDuplicates) && (
                  <div className="relative">
                    {isCheckingDuplicates && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                      </div>
                    )}
                    <DuplicateWarningPanel
                      candidates={duplicateCandidates}
                      onOpenExisting={handleOpenExisting}
                      onMarkAsDuplicate={handleMarkAsDuplicate}
                      onNotADuplicate={handleNotADuplicate}
                      decision={duplicateDecision}
                    />
                  </div>
                )}

                {/* Transaction Type Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Transaction Type</Label>
                    {transactionTypeConfidence && (
                      <ConfidenceBadge level={transactionTypeConfidence} />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTransactionTypeChange('expense')}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                        transactionType === 'expense'
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <TrendingDown className="h-6 w-6 mb-1" />
                      <span className="font-medium">Expense</span>
                      <span className="text-xs text-muted-foreground">Money spent</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleTransactionTypeChange('income')}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                        transactionType === 'income'
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <TrendingUp className="h-6 w-6 mb-1" />
                      <span className="font-medium">Income</span>
                      <span className="text-xs text-muted-foreground">Money received</span>
                    </button>
                  </div>
                </div>

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
                      placeholder={transactionType === 'income' ? 'Income title' : 'Expense title'}
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
                      transactionType={transactionType || 'expense'}
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
                    disabled={isSaving || !formData.expense_title || !formData.amount || isSaveBlocked}
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
                        Save {transactionType === 'income' ? 'Income' : 'Expense'}
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
