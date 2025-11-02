import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { EquipmentUsageLog } from '@/types/equipment-usage';
import { Loader2, Clock, User, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EquipmentHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string | null;
  equipmentName: string;
  getHistory: (equipmentId: string) => Promise<EquipmentUsageLog[]>;
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

const calculateDuration = (start: string, end: string | null) => {
  if (!end) return 'In Use';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const EquipmentHistoryDrawer: React.FC<EquipmentHistoryDrawerProps> = ({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  getHistory,
}) => {
  const [history, setHistory] = useState<EquipmentUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && equipmentId) {
      setIsLoading(true);
      getHistory(equipmentId)
        .then(setHistory)
        .finally(() => setIsLoading(false));
    }
  }, [open, equipmentId, getHistory]);

  const totalUses = history.length;
  const totalHours = history
    .filter(log => log.return_time)
    .reduce((acc, log) => {
      const diff = new Date(log.return_time!).getTime() - new Date(log.start_time).getTime();
      return acc + diff / (1000 * 60 * 60);
    }, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Equipment History</SheetTitle>
          <p className="text-sm text-muted-foreground">{equipmentName}</p>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Uses</p>
                <p className="text-2xl font-bold">{totalUses}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{Math.round(totalHours)}h</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Usage History</h3>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No usage history found
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.employee?.photo_url || ''} />
                            <AvatarFallback>
                              {log.employee?.first_name?.[0]}{log.employee?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {log.employee?.first_name} {log.employee?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {log.jobsite?.name}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Start: {format(new Date(log.start_time), 'MMM d, h:mm a')}</span>
                        </div>
                        {log.return_time && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>End: {format(new Date(log.return_time), 'MMM d, h:mm a')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Duration: {calculateDuration(log.start_time, log.return_time)}
                        </span>
                        {log.notes && (
                          <span className="text-muted-foreground italic">Has notes</span>
                        )}
                      </div>

                      {log.notes && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <p className="font-medium">Notes:</p>
                          <p className="text-muted-foreground">{log.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
