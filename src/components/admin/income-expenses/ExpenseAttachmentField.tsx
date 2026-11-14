import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isImageFile, isPdfFile, prepareReceiptImage } from '@/utils/receiptImage';

interface ExpenseAttachmentFieldProps {
  value: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

// Photos are shrunk before upload, so the raw limit can be generous.
const MAX_PHOTO_BYTES = 40 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const ExpenseAttachmentField: React.FC<ExpenseAttachmentFieldProps> = ({
  value,
  existingUrl,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingPreview, setExistingPreview] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  // Load existing file preview
  React.useEffect(() => {
    if (existingUrl && !value) {
      const { data } = supabase.storage
        .from('expense-attachments')
        .getPublicUrl(existingUrl);
      setExistingPreview(data.publicUrl);
    } else {
      setExistingPreview(null);
    }
  }, [existingUrl, value]);

  // Generate preview for new file
  React.useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so taking/choosing the same photo again still fires onChange
    event.target.value = '';
    if (file) {
      void validateAndSetFile(file);
    }
  };

  const validateAndSetFile = async (file: File) => {
    const isPdf = isPdfFile(file);
    if (!isPdf && !isImageFile(file)) {
      toast({
        title: 'File not supported',
        description: 'Please attach a photo or a PDF of the bill.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > (isPdf ? MAX_PDF_BYTES : MAX_PHOTO_BYTES)) {
      toast({
        title: 'File too large',
        description: isPdf ? 'PDFs must be under 10 MB.' : 'This photo is too large to attach.',
        variant: 'destructive',
      });
      return;
    }

    setIsPreparing(true);
    try {
      onChange(isPdf ? file : await prepareReceiptImage(file));
    } finally {
      setIsPreparing(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void validateAndSetFile(file);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <ImageIcon className="h-8 w-8 text-blue-600" />;
  };

  const displayUrl = previewUrl || existingPreview;
  const displayFile = value || (existingUrl ? { name: existingUrl.split('/').pop() || 'attachment' } as File : null);
  const isBusy = disabled || isPreparing;

  // The file pickers live outside the dialog (portaled to <body>). On iPhone,
  // returning from the camera into a picker that sits inside a modal dialog
  // can leave the dialog frozen, which is what made "Take Photo" fail.
  const pickers = createPortal(
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isBusy}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isBusy}
      />
    </>,
    document.body,
  );

  return (
    <div className="space-y-3">
      {pickers}
      {isPreparing ? (
        <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Preparing photo...</p>
        </div>
      ) : !displayFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isMobile ? 'Take a photo of the bill, or choose a file' : 'Drop your file here, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Photo or PDF
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {isMobile && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isBusy}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {displayUrl && !displayFile.name.toLowerCase().endsWith('.pdf') ? (
                <a href={displayUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
                  <img
                    src={displayUrl}
                    alt="Bill photo"
                    className="h-20 w-20 object-cover rounded border border-border"
                  />
                </a>
              ) : (
                <div className="h-20 w-20 flex items-center justify-center bg-muted rounded border border-border">
                  {getFileIcon(displayFile.name)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {displayFile.name}
              </p>
              {value && (
                <p className="text-xs text-muted-foreground mt-1">
                  {(value.size / 1024).toFixed(1)} KB
                </p>
              )}
              {existingUrl && !value && displayUrl && (
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-1 inline-block"
                >
                  Open attachment
                </a>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isBusy}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseAttachmentField;
