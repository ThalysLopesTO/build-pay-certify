import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInventoryPhotos, getInventoryPhotoUrl, InventoryPhoto } from '@/hooks/useInventoryPhotos';
import { Camera, Plus, Trash2, X, Loader2, ImageIcon, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentPhotoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
  equipmentName: string;
  canManage: boolean;
}

const EquipmentPhotoGallery: React.FC<EquipmentPhotoGalleryProps> = ({
  isOpen,
  onClose,
  inventoryId,
  equipmentName,
  canManage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<InventoryPhoto | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const {
    photos,
    isLoading,
    uploadPhotos,
    deletePhoto,
    isUploading,
  } = useInventoryPhotos(inventoryId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        return false;
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      await uploadPhotos({ inventoryId, files: validFiles });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photo: InventoryPhoto) => {
    setDeletingPhotoId(photo.id);
    try {
      await deletePhoto(photo);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Equipment Photos
            </DialogTitle>
            <DialogDescription>
              {equipmentName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">No photos yet</p>
                {canManage && (
                  <p className="text-sm text-muted-foreground">
                    Click the button below to add photos
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border bg-muted/50"
                  >
                    <img
                      src={getInventoryPhotoUrl(photo.file_path)}
                      alt={photo.file_name}
                      className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      
                      {canManage && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeletePhoto(photo)}
                          disabled={deletingPhotoId === photo.id}
                        >
                          {deletingPhotoId === photo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload button */}
          {canManage && (
            <div className="pt-4 border-t">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Photos
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-size photo viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {selectedPhoto && (
              <img
                src={getInventoryPhotoUrl(selectedPhoto.file_path)}
                alt={selectedPhoto.file_name}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EquipmentPhotoGallery;

// Camera icon button component for use in tables/cards
interface PhotoIconButtonProps {
  photoCount: number;
  onClick: () => void;
  className?: string;
}

export const PhotoIconButton: React.FC<PhotoIconButtonProps> = ({
  photoCount,
  onClick,
  className,
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 relative transition-all hover:scale-110', className)}
      onClick={onClick}
    >
      <Camera className="h-4 w-4 text-muted-foreground" />
      {photoCount > 0 && (
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground"
        >
          {photoCount > 9 ? '9+' : photoCount}
        </Badge>
      )}
    </Button>
  );
};
