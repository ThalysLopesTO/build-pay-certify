
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PunchEntry {
  id: string;
  user_id: string;
  jobsite_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  status: string;
  user_profiles: {
    first_name: string;
    last_name: string;
  } | null;
  jobsites: {
    name: string;
  } | null;
}

interface LivePunchTableProps {
  filteredEntries: PunchEntry[];
  selectedDate: Date;
  flaggedEntries: Set<string>;
  onToggleFlag: (entryId: string) => void;
  onViewLocation: (entry: PunchEntry) => void;
}

const LivePunchTable: React.FC<LivePunchTableProps> = ({
  filteredEntries,
  selectedDate,
  flaggedEntries,
  onToggleFlag,
  onViewLocation
}) => {
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calculateTotalTime = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn) return '0h 0m';
    
    const startTime = new Date(checkIn);
    const endTime = checkOut ? new Date(checkOut) : new Date();
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (entry: PunchEntry) => {
    if (!entry.check_out_time) {
      return <Badge variant="default" className="bg-green-500">Clocked In</Badge>;
    } else {
      return <Badge variant="secondary">Clocked Out</Badge>;
    }
  };

  const formatEmployeeNameWithDate = (entry: PunchEntry) => {
    const employeeName = entry.user_profiles ? 
      `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 
      'Unknown Employee';
    
    if (entry.check_in_time) {
      const checkInDate = new Date(entry.check_in_time);
      const dayDate = format(checkInDate, 'EEE, MMM dd');
      return `${dayDate} – ${employeeName}`;
    }
    
    return employeeName;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isToday(selectedDate) ? "Today's Punch Entries" : `Punch Entries for ${format(selectedDate, 'MMM dd, yyyy')}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Jobsite</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead>Check-out Time</TableHead>
              <TableHead>Total Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No punch entries found for {format(selectedDate, 'MMMM dd, yyyy')}
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow 
                  key={entry.id}
                  className={flaggedEntries.has(entry.id) ? 'bg-red-50 border-l-4 border-l-red-500' : ''}
                >
                  <TableCell className="font-medium">
                    {formatEmployeeNameWithDate(entry)}
                  </TableCell>
                  <TableCell>{entry.jobsites?.name || 'Unknown Jobsite'}</TableCell>
                  <TableCell>
                    {entry.check_in_time 
                      ? format(new Date(entry.check_in_time), 'h:mm a')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {entry.check_out_time 
                      ? format(new Date(entry.check_out_time), 'h:mm a')
                      : 'Still active'
                    }
                  </TableCell>
                  <TableCell>
                    {calculateTotalTime(entry.check_in_time, entry.check_out_time)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(entry)}
                  </TableCell>
                  <TableCell>
                    {entry.check_in_location ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewLocation(entry)}
                        className="p-2 h-8 w-8"
                      >
                        <MapPin className="h-4 w-4 text-blue-500" />
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-sm">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleFlag(entry.id)}
                      className={cn(
                        "p-2 h-8 w-8",
                        flaggedEntries.has(entry.id) 
                          ? "text-red-600 hover:text-red-700" 
                          : "text-gray-400 hover:text-red-500"
                      )}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LivePunchTable;
