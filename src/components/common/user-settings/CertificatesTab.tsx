import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmployeeCertificates } from '@/hooks/useEmployeeCertificates';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Plus, 
  FileText, 
  Trash2, 
  CalendarIcon, 
  Upload, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CERTIFICATE_TYPES = [
  { value: 'whmis', label: 'WHMIS' },
  { value: 'working-at-heights', label: 'Working at Heights' },
  { value: 'first-aid', label: 'First Aid / CPR' },
  { value: 'forklift', label: 'Forklift Operator' },
  { value: 'fall-protection', label: 'Fall Protection' },
  { value: 'confined-space', label: 'Confined Space' },
  { value: 'scaffolding', label: 'Scaffolding' },
  { value: 'electrical-safety', label: 'Electrical Safety' },
  { value: 'other', label: 'Other' },
];

const CertificatesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { certificates, isLoading, deleteCertificate, isDeletingCertificate } = useEmployeeCertificates(user?.id);
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    certificateName: '',
    certificateType: '',
    expiryDate: null as Date | null,
    neverExpires: false,
    file: null as File | null,
  });

  const getStatusBadge = (status: string, expiryDate: string | null) => {
    if (status === 'expired') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (status === 'expiring') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
        <CheckCircle className="h-3 w-3" />
        Valid
      </Badge>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!formData.certificateName || !formData.certificateType) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the certificate name and type.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.neverExpires && !formData.expiryDate) {
      toast({
        title: 'Missing Expiry Date',
        description: 'Please select an expiry date or check "Never Expires".',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = null;

      // Upload file if provided
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(fileName, formData.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName);
        
        fileUrl = urlData.publicUrl;
      }

      // Insert certificate record
      const { error: insertError } = await supabase
        .from('employee_certificates')
        .insert({
          employee_id: user?.id,
          company_id: user?.companyId,
          certificate_name: formData.certificateName,
          certificate_type: formData.neverExpires ? 'no-expiry' : formData.certificateType,
          expiry_date: formData.neverExpires ? null : formData.expiryDate?.toISOString().split('T')[0],
          file_url: fileUrl,
          uploaded_by: user?.id,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Certificate Uploaded',
        description: 'Your certificate has been uploaded successfully.',
      });

      // Reset form
      setFormData({
        certificateName: '',
        certificateType: '',
        expiryDate: null,
        neverExpires: false,
        file: null,
      });
      setShowUploadForm(false);

      // Refresh certificates
      queryClient.invalidateQueries({ queryKey: ['employee-certificates', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['employee-certificate-status', user?.id] });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload certificate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (certificateId: string) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      deleteCertificate(certificateId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Certificates</CardTitle>
            <CardDescription>
              Upload and manage your safety certificates and training documents
            </CardDescription>
          </div>
          {!showUploadForm && (
            <Button onClick={() => setShowUploadForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload Certificate
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Form */}
        {showUploadForm && (
          <Card className="border-dashed">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Upload New Certificate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certificateName">Certificate Name *</Label>
                  <Input
                    id="certificateName"
                    placeholder="e.g., WHMIS Training 2024"
                    value={formData.certificateName}
                    onChange={(e) => setFormData(prev => ({ ...prev, certificateName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificateType">Certificate Type *</Label>
                  <Select
                    value={formData.certificateType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, certificateType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CERTIFICATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <div className="flex items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !formData.expiryDate && !formData.neverExpires && 'text-muted-foreground'
                        )}
                        disabled={formData.neverExpires}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiryDate ? format(formData.expiryDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expiryDate || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, expiryDate: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="neverExpires"
                      checked={formData.neverExpires}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          neverExpires: checked === true,
                          expiryDate: checked ? null : prev.expiryDate 
                        }))
                      }
                    />
                    <Label htmlFor="neverExpires" className="text-sm">Never Expires</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Certificate File (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG (max 10MB)
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Certificate
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadForm(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : certificates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No certificates uploaded yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your safety certificates to keep them organized and track expiry dates
              </p>
              {!showUploadForm && (
                <Button onClick={() => setShowUploadForm(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Certificate
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium truncate">{cert.certificate_name}</h4>
                      {getStatusBadge(cert.status, cert.expiry_date)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="capitalize">{cert.certificate_type.replace(/-/g, ' ')}</span>
                      {cert.expiry_date && (
                        <span className="ml-2">
                          • Expires: {format(new Date(cert.expiry_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {cert.certificate_type === 'no-expiry' && (
                        <span className="ml-2">• Never Expires</span>
                      )}
                    </div>
                    {cert.status === 'expiring' && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Renewal required within 30 days
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {cert.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(cert.file_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cert.id)}
                      disabled={isDeletingCertificate}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificatesTab;
