import React, { useState, useCallback } from 'react';
import { Upload, X, FileImage, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

interface FileUploadFieldProps {
  value: FileWithPreview[];
  onChange: (files: FileWithPreview[]) => void;
  error?: string;
  disabled?: boolean;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback((files: FileList) => {
    const newFiles: FileWithPreview[] = [];
    
    Array.from(files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return;
      }

      // Check if we already have 5 files
      if (value.length + newFiles.length >= 5) {
        return;
      }

      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: Math.random().toString(36).substring(7),
      });

      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      newFiles.push(fileWithPreview);
    });

    onChange([...value, ...newFiles]);
  }, [value, onChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    const newFiles = value.filter(file => file.id !== id);
    // Revoke object URLs to prevent memory leaks
    value.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    onChange(newFiles);
  }, [value, onChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <FormItem>
      <FormLabel>Upload Photos (Optional)</FormLabel>
      <div className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-gray-300",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-500"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleChange}
            disabled={disabled || value.length >= 5}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, PDF up to 10MB (max 5 files)
              </p>
            </div>
          </div>
          
          {value.length >= 5 && (
            <div className="absolute inset-0 bg-gray-50/80 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
                <p className="text-sm font-medium text-gray-700 mt-2">
                  Maximum 5 files allowed
                </p>
              </div>
            </div>
          )}
        </div>

        {/* File Previews */}
        {value.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {value.map((file) => (
              <div
                key={file.id}
                className="relative bg-gray-50 rounded-lg p-4 border"
              >
                <div className="flex items-start space-x-3">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                        {file.type.startsWith('image/') ? (
                          <FileImage className="h-6 w-6 text-gray-500" />
                        ) : (
                          <FileText className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
};

export default FileUploadField;