
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface PunchEntry {
  id: string;
  check_out_time: string | null;
  jobsite_id: string;
}

interface LivePunchSummaryCardsProps {
  filteredEntries: PunchEntry[];
  selectedDate: Date;
}

const LivePunchSummaryCards: React.FC<LivePunchSummaryCardsProps> = ({
  filteredEntries,
  selectedDate
}) => {
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">
                {isToday(selectedDate) ? 'Currently Clocked In' : 'Were Clocked In'}
              </p>
              <p className="text-2xl font-bold">
                {filteredEntries.filter(e => !e.check_out_time).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">
                Total Employees {isToday(selectedDate) ? 'Today' : 'That Day'}
              </p>
              <p className="text-2xl font-bold">{filteredEntries.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Jobsites</p>
              <p className="text-2xl font-bold">
                {new Set(filteredEntries.filter(e => !e.check_out_time).map(e => e.jobsite_id)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LivePunchSummaryCards;
