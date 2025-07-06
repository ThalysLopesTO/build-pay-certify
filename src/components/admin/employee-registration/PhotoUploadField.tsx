import React, { useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Camera, Upload, X, Smartphone } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EmployeeFormData } from './schemas';
import CameraModal from './CameraModal';

interface PhotoUploadFieldProps {
  form: UseFormReturn<EmployeeFormData>;
}

const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({ form }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const { toast } = useToast();

  // Check camera support on component mount
  React.useEffect(() => {
    const checkCameraSupport = () => {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    };
    setIsCameraSupported(checkCameraSupport());
  }, []);

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

  const handleMobileCameraClick = () => {
    mobileInputRef.current?.click();
  };

  const handleCameraCapture = (file: File) => {
    handleFileSelect(file);
    setShowCameraModal(false);
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

              {/* Mobile camera input */}
              <input
                ref={mobileInputRef}
                type="file"
                accept="image/*"
                capture="user"
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
                <div className="space-y-3">
                  {/* Camera capture options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Desktop/Webcam Capture */}
                    {isCameraSupported && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCameraModal(true)}
                        className="h-16 border-dashed border-2 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <Camera className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Take Photo</span>
                          <span className="text-xs text-muted-foreground">Use camera</span>
                        </div>
                      </Button>
                    )}
                    
                    {/* Mobile Camera Capture */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleMobileCameraClick}
                      className="h-16 border-dashed border-2 hover:border-green-400 hover:bg-green-50 sm:hidden"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">Camera</span>
                        <span className="text-xs text-muted-foreground">Mobile</span>
                      </div>
                    </Button>
                    
                    {/* File Upload */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleButtonClick}
                      className="h-16 border-dashed border-2 hover:border-orange-400 hover:bg-orange-50"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Upload className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium">Upload File</span>
                        <span className="text-xs text-muted-foreground">JPG, PNG up to 2MB</span>
                      </div>
                    </Button>
                  </div>
                  
                  {/* Fallback message */}
                  {!isCameraSupported && (
                    <p className="text-xs text-center text-muted-foreground">
                      Camera not supported on this device. Please upload a photo file.
                    </p>
                  )}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />

          {/* Camera Modal */}
          <CameraModal
            isOpen={showCameraModal}
            onClose={() => setShowCameraModal(false)}
            onCapture={handleCameraCapture}
          />
        </FormItem>
      )}
    />
  );
};

export default PhotoUploadField;