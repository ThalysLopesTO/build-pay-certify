import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, User, Mail, Phone, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import CompanyStatusBadge from '../CompanyStatusBadge';

interface RegistrationRequest {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface MobileRequestCardProps {
  request: RegistrationRequest;
  onApprove: (request: RegistrationRequest) => void;
  onReject: (request: RegistrationRequest) => void;
  isProcessing: boolean;
}

export const MobileRequestCard: React.FC<MobileRequestCardProps> = ({
  request,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden transition-all duration-200">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-foreground truncate">
                {request.company_name}
              </h3>
            </div>
            <CompanyStatusBadge
              status={request.status}
              isExpired={false}
              daysUntilExpiry={null}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="ml-2 flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Admin Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm">
            <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span className="font-medium">
              {request.admin_first_name} {request.admin_last_name}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(request.created_at), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="pt-3 border-t space-y-2 animate-fade-in">
            <div className="flex items-center text-sm">
              <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground break-all">
                {request.admin_email}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground break-all">
                {request.company_email}
              </span>
            </div>
            {request.company_phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {request.company_phone}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {request.status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            <Button
              size="sm"
              className="flex-1 touch-target bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(request)}
              disabled={isProcessing}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 touch-target"
              onClick={() => onReject(request)}
              disabled={isProcessing}
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
