import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building2,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { MaterialRequest, RequestStatus } from '../types/materialRequest';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CompactMaterialRequestCardProps {
  request: MaterialRequest;
  onViewDetails: (request: MaterialRequest) => void;
  onExportPDF: (request: MaterialRequest) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const CompactMaterialRequestCard = ({
  request,
  onViewDetails,
  onExportPDF,
  onDelete,
  isAdmin
}: CompactMaterialRequestCardProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ordered': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'archived': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatUserDisplay = (userId: string | null, userName?: string) => {
    if (!userId) return 'Former Employee';
    if (userName && userName.trim()) return userName;
    return `User ${userId.substring(0, 8)}...`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="border border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20 transition-all duration-200 cursor-pointer group"
      onClick={() => onViewDetails(request)}
    >
      <CardContent className="p-3">
        {/* Row 1: Jobsite name + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-semibold text-foreground truncate">
              {request.jobsites?.name || 'Unknown Jobsite'}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${getStatusColor(request.status)} text-xs px-2 py-1 font-medium`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
            <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onViewDetails(request)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportPDF(request)}>
                  Export PDF
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(request.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Info chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Submitted by */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="bg-blue-100 p-1 rounded flex-shrink-0">
              <User className="h-3 w-3 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Submitted by</p>
              <p className="text-xs font-medium text-foreground truncate">
                {truncateText(formatUserDisplay(request.submitted_by, (request as any).submitted_by_name), 15)}
              </p>
            </div>
          </div>

          {/* Address */}
          {request.jobsites?.address && (
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="bg-green-100 p-1 rounded flex-shrink-0">
                <MapPin className="h-3 w-3 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-xs font-medium text-foreground truncate">
                  {truncateText(request.jobsites.address, 20)}
                </p>
              </div>
            </div>
          )}

          {/* Delivery Date */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="bg-purple-100 p-1 rounded flex-shrink-0">
              <Calendar className="h-3 w-3 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p className="text-xs font-medium text-foreground">
                {format(new Date(request.delivery_date), 'MMM dd')}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="bg-orange-100 p-1 rounded flex-shrink-0">
              <Clock className="h-3 w-3 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-xs font-medium text-foreground">
                {request.delivery_time}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactMaterialRequestCard;