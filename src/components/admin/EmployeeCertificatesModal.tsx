
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Upload, Trash2, ExternalLink } from 'lucide-react';
import { useEmployeeCertificates } from '@/hooks/useEmployeeCertificates';
import CertificateUploadModal from './CertificateUploadModal';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface EmployeeCertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const EmployeeCertificatesModal: React.FC<EmployeeCertificatesModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { 
    certificates, 
    isLoading, 
    error, 
    deleteCertificate, 
    refreshCertificates,
    isDeletingCertificate 
  } = useEmployeeCertificates(employee?.id);

  const getCertStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expiring':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-slate-500" />;
    }
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getCertStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Valid';
      case 'expiring':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const handleDeleteCertificate = (certId: string) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      deleteCertificate(certId);
    }
  };

  const handleViewFile = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleUploadSuccess = () => {
    refreshCertificates();
    setUploadModalOpen(false);
  };

  if (!employee) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Certificates - {employee.first_name} {employee.last_name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => setUploadModalOpen(true)} 
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Certificate
              </Button>
            </div>

            {/* Error state */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error loading certificates: {error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading state */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Loading certificates...</p>
              </div>
            ) : certificates.length === 0 ? (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  No certificates found for this employee.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getCertStatusIcon(cert.status)}
                          <h3 className="font-semibold">{cert.certificate_name}</h3>
                          <Badge className={getCertStatusColor(cert.status)}>
                            {getCertStatusText(cert.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Type:</span>
                            <p>{cert.certificate_type}</p>
                          </div>
                          <div>
                            <span className="font-medium">Expiry Date:</span>
                            <p>{new Date(cert.expiry_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">Upload Date:</span>
                            <p>{new Date(cert.upload_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">File:</span>
                            {cert.file_url ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-blue-600"
                                onClick={() => handleViewFile(cert.file_url!)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View File
                              </Button>
                            ) : (
                              <p className="text-slate-400">No file attached</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCertificate(cert.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeletingCertificate}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status summary */}
            {certificates.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Certificate Status Summary</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-green-600 font-semibold">
                      {certificates.filter(c => c.status === 'valid').length}
                    </div>
                    <div className="text-slate-600">Valid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-600 font-semibold">
                      {certificates.filter(c => c.status === 'expiring').length}
                    </div>
                    <div className="text-slate-600">Expiring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-600 font-semibold">
                      {certificates.filter(c => c.status === 'expired').length}
                    </div>
                    <div className="text-slate-600">Expired</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <CertificateUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        employee={employee}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
};

export default EmployeeCertificatesModal;
