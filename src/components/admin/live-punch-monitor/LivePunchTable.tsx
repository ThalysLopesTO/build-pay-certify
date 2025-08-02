
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Flag, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Global Google Maps type declaration
declare global {
  interface Window {
    google: any;
  }
}

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
    latitude: number | null;
    longitude: number | null;
  } | null;
}

interface LivePunchTableProps {
  filteredEntries: PunchEntry[];
  selectedDate: Date;
  flaggedEntries: Set<string>;
  onToggleFlag: (entryId: string) => void;
  onViewLocation: (entry: PunchEntry) => void;
  onEdit?: (entry: PunchEntry) => void;
  onDelete?: (entry: PunchEntry) => void;
}

const LivePunchTable: React.FC<LivePunchTableProps> = ({
  filteredEntries,
  selectedDate,
  flaggedEntries,
  onToggleFlag,
  onViewLocation,
  onEdit,
  onDelete
}) => {
  // Distance calculation functions
  const parseLocation = (locationString: string | null) => {
    if (!locationString) return null;
    
    const coordRegex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
    const match = locationString.match(coordRegex);
    
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    return null;
  };

  const calculateDistance = (
    punch: { lat: number; lng: number },
    jobsite: { lat: number; lng: number }
  ) => {
    if (window.google?.maps?.geometry?.spherical) {
      const punchLatLng = new window.google.maps.LatLng(punch.lat, punch.lng);
      const jobsiteLatLng = new window.google.maps.LatLng(jobsite.lat, jobsite.lng);
      return window.google.maps.geometry.spherical.computeDistanceBetween(punchLatLng, jobsiteLatLng);
    }
    return null;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const getDistanceStatus = (entry: PunchEntry) => {
    const punchCoords = parseLocation(entry.check_in_location);
    const jobsiteCoords = entry.jobsites?.latitude && entry.jobsites?.longitude ? {
      lat: entry.jobsites.latitude,
      lng: entry.jobsites.longitude
    } : null;

    if (!punchCoords || !jobsiteCoords) {
      return null;
    }

    const distance = calculateDistance(punchCoords, jobsiteCoords);
    if (distance === null) return null;

    const threshold = 200; // 200 meters threshold
    const formattedDistance = formatDistance(distance);
    const isFarFromJobsite = distance > threshold;

    return {
      distance,
      formattedDistance,
      isFarFromJobsite,
      tooltipText: `Punched in ${formattedDistance} from jobsite`
    };
  };

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
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>
            {isToday(selectedDate) ? "Today's Punch Records" : `Punch Records for ${format(selectedDate, 'MMM dd, yyyy')}`}
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
                <TableHead>Distance Flag</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No punch records found for {format(selectedDate, 'MMMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const distanceStatus = getDistanceStatus(entry);
                  
                  return (
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
                        {distanceStatus ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewLocation(entry)}
                                className={cn(
                                  "p-2 h-8 w-8",
                                  distanceStatus.isFarFromJobsite 
                                    ? "text-yellow-500 hover:text-yellow-600" 
                                    : "text-green-500 hover:text-green-600"
                                )}
                              >
                                {distanceStatus.isFarFromJobsite ? (
                                  <AlertTriangle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{distanceStatus.tooltipText}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : entry.check_in_location && !entry.jobsites?.latitude ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-gray-400 text-sm cursor-help">N/A</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Jobsite coordinates not available</p>
                            </TooltipContent>
                          </Tooltip>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(entry)}
                              className="p-2 h-8 w-8"
                              title="Edit Punch Record"
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          {onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 h-8 w-8"
                                  title="Delete Punch Record"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Punch Record</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this punch record for{' '}
                                    <strong>
                                      {entry.user_profiles 
                                        ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` 
                                        : 'Unknown Employee'
                                      }
                                    </strong>
                                    ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(entry)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LivePunchTable;
