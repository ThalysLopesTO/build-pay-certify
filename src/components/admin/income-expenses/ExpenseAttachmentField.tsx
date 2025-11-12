import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface ExpenseAttachmentFieldProps {
  value: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

const ExpenseAttachmentField: React.FC<ExpenseAttachmentFieldProps> = ({
  value,
  existingUrl,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingPreview, setExistingPreview] = useState<string | null>(null);

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
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    onChange(file);
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
      validateAndSetFile(file);
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

  return (
    <div className="space-y-3">
      {!displayFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {isMobile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {displayUrl && !displayFile.name.toLowerCase().endsWith('.pdf') ? (
                <img
                  src={displayUrl}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded border border-border"
                />
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
              {existingUrl && !value && (
                <p className="text-xs text-muted-foreground mt-1">
                  Existing attachment
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
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
