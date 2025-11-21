import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Camera, Trash2 } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  firstName?: string;
  lastName?: string;
  onPhotoChange: (file: File | null) => void;
  onRemovePhoto: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  firstName,
  lastName,
  onPhotoChange,
  onRemovePhoto,
}) => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG or PNG image",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = '';
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onPhotoChange(file);

    toast({
      title: "Photo Selected",
      description: "Click 'Update Profile' to save your new photo",
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleMobileCameraClick = () => {
    mobileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setShowRemoveConfirm(true);
  };

  const confirmRemovePhoto = () => {
    setPreviewUrl(null);
    onRemovePhoto();
    setShowRemoveConfirm(false);
    
    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileInputRef.current) mobileInputRef.current.value = '';

    toast({
      title: "Photo Removed",
      description: "Click 'Update Profile' to save changes",
    });
  };

  const displayPhotoUrl = previewUrl || currentPhotoUrl;
  const hasPhoto = displayPhotoUrl || currentPhotoUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <EmployeeAvatar
          photoUrl={displayPhotoUrl}
          firstName={firstName}
          lastName={lastName}
          size="lg"
        />
        {previewUrl && (
          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs font-medium">
            New
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Desktop Upload Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          className="hidden sm:flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Change Photo
        </Button>

        {/* Mobile Camera Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMobileCameraClick}
          className="sm:hidden flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Take Photo
        </Button>

        {/* Remove Photo Button */}
        {hasPhoto && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemovePhoto}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Remove Photo
          </Button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={mobileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your profile photo and show your initials instead. You can always add a new photo later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemovePhoto}>
              Remove Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePhotoUpload;
