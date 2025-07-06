import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front-facing camera for selfies
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions or use file upload instead.');
      toast({
        title: 'Camera Access Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data as base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (!capturedImage || !canvasRef.current) return;

    // Convert canvas to blob and then to File
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `employee-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        handleClose();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Take Employee Photo</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <Button onClick={handleClose} variant="outline">
                Close and Use File Upload
              </Button>
            </div>
          ) : capturedImage ? (
            // Show captured image preview
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured photo"
                    className="max-w-full h-auto rounded-lg border-2 border-gray-200"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={retakePhoto} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={confirmCapture} className="bg-green-600 hover:bg-green-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Use This Photo
                </Button>
              </div>
            </div>
          ) : (
            // Show live camera feed
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto"
                    style={{ maxWidth: '640px', maxHeight: '480px' }}
                  />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-white">Loading camera...</div>
                    </div>
                  )}
                </div>
              </div>

              {isStreaming && (
                <div className="flex justify-center space-x-4">
                  <Button onClick={handleClose} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;