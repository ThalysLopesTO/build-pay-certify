
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

const CertificateStatus = () => {
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-500';
      case 'expiring':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4" />;
      case 'expiring':
        return <AlertTriangle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
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

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <span>Safety Certifications</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.certificates.map((cert) => (
            <div key={cert.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{cert.name}</h3>
                <Badge className={`${getStatusColor(cert.status)} text-white`}>
                  <span className="flex items-center space-x-1">
                    {getStatusIcon(cert.status)}
                    <span>{getStatusText(cert.status)}</span>
                  </span>
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                Expires: {new Date(cert.expiryDate).toLocaleDateString()}
              </p>
              {cert.status === 'expiring' && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ Renewal required within 30 days
                </p>
              )}
              {cert.status === 'expired' && (
                <p className="text-sm text-red-600 mt-1">
                  ❌ Certificate has expired - Contact admin
                </p>
              )}
            </div>
          ))}
        </div>
        
        {user?.certificates.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>No certificates on file</p>
            <p className="text-sm">Contact your administrator to upload certificates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateStatus;
