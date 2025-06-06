
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

const CERTIFICATE_TYPES = [
  'WHMIS',
  'Working at Heights',
  '4 Steps Safety',
  'Fall Protection',
  'Confined Space',
  'First Aid/CPR',
  'Forklift Operation',
  'Scaffolding',
  'Hot Work Permit',
  'Other'
];

const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess
}) => {
  const [certificateName, setCertificateName] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF, JPG, or PNG file.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please upload a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee || !user?.companyId) {
      toast({
        title: 'Error',
        description: 'Missing employee or company information.',
        variant: 'destructive',
      });
      return;
    }

    if (!certificateName || !certificateType || !expiryDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      let fileUrl = null;

      // Upload file if provided
      if (file) {
        const fileName = `${user.companyId}/${employee.id}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      // Insert certificate record
      const { error: insertError } = await supabase
        .from('employee_certificates')
        .insert({
          employee_id: employee.id,
          company_id: user.companyId,
          certificate_name: certificateName,
          certificate_type: certificateType,
          expiry_date: expiryDate,
          file_url: fileUrl,
          uploaded_by: user.id
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Certificate Uploaded',
        description: `Certificate for ${employee.first_name} ${employee.last_name} has been uploaded successfully.`,
      });

      // Reset form
      setCertificateName('');
      setCertificateType('');
      setExpiryDate('');
      setFile(null);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading certificate:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload certificate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setCertificateName('');
      setCertificateType('');
      setExpiryDate('');
      setFile(null);
      onClose();
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Certificate - {employee.first_name} {employee.last_name}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificateName">Certificate Name *</Label>
            <Input
              id="certificateName"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="e.g., WHMIS Training Certificate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificateType">Certificate Type *</Label>
            <Select value={certificateType} onValueChange={setCertificateType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select certificate type" />
              </SelectTrigger>
              <SelectContent>
                {CERTIFICATE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Certificate File (Optional)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="flex-1"
              />
              {file && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: PDF, JPG, PNG (Max 10MB)
            </p>
            {file && (
              <p className="text-sm text-green-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Certificate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateUploadModal;
