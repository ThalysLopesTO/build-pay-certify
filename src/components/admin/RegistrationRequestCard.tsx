
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, User, Mail, Phone, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RegistrationRequest {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_address: string | null;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface RegistrationRequestCardProps {
  request: RegistrationRequest;
  onApprove: (request: RegistrationRequest) => void;
  onReject: (request: RegistrationRequest) => void;
  isProcessing: boolean;
}

const RegistrationRequestCard: React.FC<RegistrationRequestCardProps> = ({
  request,
  onApprove,
  onReject,
  isProcessing
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isPending = request.status === 'pending';

  return (
    <Card className={isPending ? 'border-yellow-200 bg-yellow-50/30' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              {request.company_name}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Clock className="h-4 w-4 mr-1" />
              Submitted {format(new Date(request.created_at), 'PPP')}
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Company Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Company Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                {request.company_email}
              </div>
              {request.company_phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-slate-400" />
                  {request.company_phone}
                </div>
              )}
              {request.company_address && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-slate-400 mt-0.5" />
                  <span>{request.company_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Administrator</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-slate-400" />
                {request.admin_first_name} {request.admin_last_name}
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-slate-400" />
                {request.admin_email}
              </div>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="flex space-x-3 mt-6 pt-4 border-t">
            <Button
              onClick={() => onApprove(request)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => onReject(request)}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationRequestCard;
