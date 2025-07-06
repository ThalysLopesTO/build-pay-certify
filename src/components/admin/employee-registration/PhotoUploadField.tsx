import React, { useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Camera, Upload, X } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EmployeeFormData } from './schemas';

interface PhotoUploadFieldProps {
  form: UseFormReturn<EmployeeFormData>;
}

const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({ form }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      form.setValue('photo', undefined);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive"
      });
      return;
    }

    form.setValue('photo', file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    handleFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <FormField
      control={form.control}
      name="photo"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center space-x-2">
            <Camera className="h-4 w-4" />
            <span>Upload Employee Photo</span>
            <span className="text-sm text-muted-foreground">(Optional)</span>
          </FormLabel>
          <FormControl>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleFileSelect(file);
                }}
              />
              
              {previewUrl ? (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Employee photo preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Photo selected</p>
                    <p className="text-xs text-muted-foreground">
                      {field.value?.name} ({((field.value?.size || 0) / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleButtonClick}
                  className="w-full h-20 border-dashed"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload employee photo</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG up to 2MB</p>
                    </div>
                  </div>
                </Button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default PhotoUploadField;