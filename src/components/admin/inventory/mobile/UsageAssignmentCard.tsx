import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EquipmentUsageLog } from '@/types/equipment-usage';
import { Edit, RotateCcw, History, Trash2, MapPin, Clock } from 'lucide-react';
import { formatInCompanyTimezone } from '@/utils/timezone';

interface UsageAssignmentCardProps {
  log: EquipmentUsageLog;
  onReturn: (log: EquipmentUsageLog) => void;
  onEdit: (log: EquipmentUsageLog) => void;
  onDelete: (log: EquipmentUsageLog) => void;
  onViewHistory: (log: EquipmentUsageLog) => void;
  canManage: boolean;
  timezone?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_use': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'returned': return 'bg-green-500/10 text-green-700 border-green-200';
    case 'damaged': return 'bg-orange-500/10 text-orange-700 border-orange-200';
    case 'lost': return 'bg-red-500/10 text-red-700 border-red-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusBorderColor = (status: string) => {
  switch (status) {
    case 'in_use': return 'border-l-blue-500';
    case 'returned': return 'border-l-green-500';
    case 'damaged': return 'border-l-orange-500';
    case 'lost': return 'border-l-red-500';
    default: return 'border-l-muted';
  }
};

const calculateDuration = (start: string, end: string | null) => {
  if (!end) return 'In Use';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const UsageAssignmentCard: React.FC<UsageAssignmentCardProps> = ({
  log,
  onReturn,
  onEdit,
  onDelete,
  onViewHistory,
  canManage,
  timezone,
}) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const offset = touchStart - e.targetTouches[0].clientX;
    if (offset > 0 && offset < 120 && log.status === 'in_use' && canManage) {
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 80 && log.status === 'in_use' && canManage) {
      onReturn(log);
    }
    setSwipeOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Action Background */}
      {log.status === 'in_use' && canManage && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-orange-500 flex items-center justify-center rounded-r-lg">
          <RotateCcw className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Main Card */}
      <Card
        className={`border-l-4 ${getStatusBorderColor(log.status)} transition-transform`}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">
          {/* Header: Equipment Name + Status */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate">
                {log.equipment?.equipment_name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {log.equipment?.brand} • {log.equipment?.sku}
              </p>
            </div>
            <Badge className={getStatusColor(log.status)} variant="outline">
              {log.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Employee Info */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={log.employee?.photo_url || ''} />
              <AvatarFallback className="text-xs">
                {log.employee?.first_name?.[0]}{log.employee?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {log.employee?.first_name} {log.employee?.last_name}
            </span>
          </div>

          {/* Jobsite + Start Time */}
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{log.jobsite?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatInCompanyTimezone(log.start_time, 'MMM d, h:mm a', timezone)}
              </span>
            </div>
          </div>

          {/* Duration + Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="text-sm">
              <span className="text-muted-foreground">Duration: </span>
              <span className="font-medium">
                {calculateDuration(log.start_time, log.return_time)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Edit Button */}
              {canManage && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(log)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4 text-blue-500" />
                </Button>
              )}

              {/* Return Button - Only for in_use items */}
              {canManage && log.status === 'in_use' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReturn(log)}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                </Button>
              )}

              {/* History Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewHistory(log)}
                className="h-8 w-8 p-0"
              >
                <History className="h-4 w-4 text-slate-600" />
              </Button>

              {/* Delete Button */}
              {canManage && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(log)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>

          {/* Notes if present */}
          {log.notes && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground italic">
                Note: {log.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
