import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Download, FileText, X } from 'lucide-react';
import { useMaterialRequestAttachments, getMaterialRequestAttachmentUrl } from '@/hooks/useMaterialRequestAttachments';
import { Badge } from '@/components/ui/badge';

interface MaterialRequestPhotosViewerProps {
  materialRequestId: string;
  trigger?: React.ReactNode;
}

const MaterialRequestPhotosViewer: React.FC<MaterialRequestPhotosViewerProps> = ({
  materialRequestId,
  trigger,
}) => {
  const { data: attachments = [], isLoading } = useMaterialRequestAttachments(materialRequestId);

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = getMaterialRequestAttachmentUrl(filePath);
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Camera className="h-4 w-4 mr-1" />
      📷 View Photos ({attachments.length})
    </Button>
  );

  if (attachments.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Material Request Attachments</span>
            <Badge variant="secondary">{attachments.length} files</Badge>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading attachments...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Images Grid */}
            {attachments.filter(att => att.file_type.startsWith('image/')).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attachments
                    .filter(attachment => attachment.file_type.startsWith('image/'))
                    .map((attachment) => {
                      const imageUrl = getMaterialRequestAttachmentUrl(attachment.file_path);
                      return (
                        <div
                          key={attachment.id}
                          className="relative group bg-white rounded-lg border shadow-sm overflow-hidden"
                        >
                          <div className="aspect-square">
                            <img
                              src={imageUrl}
                              alt={attachment.file_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          
                          {/* Overlay with actions */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownload(attachment.file_path, attachment.file_name)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* File info */}
                          <div className="p-3">
                            <p className="text-sm font-medium truncate" title={attachment.file_name}>
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {/* Documents List */}
            {attachments.filter(att => !att.file_type.startsWith('image/')).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Documents</h3>
                <div className="space-y-2">
                  {attachments
                    .filter(attachment => !attachment.file_type.startsWith('image/'))
                    .map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{attachment.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.file_size)} • {attachment.file_type}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(attachment.file_path, attachment.file_name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MaterialRequestPhotosViewer;