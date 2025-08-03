
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
  // TODO: Will re-add distance calculation functions later for jobsite comparison
  
  const getDistanceStatus = (entry: PunchEntry) => {
    // TODO: Will re-implement distance calculation logic later
    // For now, always return null to hide distance status
    return null;
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
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            {isToday(selectedDate) ? "Today's Punch Records" : `Punch Records for ${format(selectedDate, 'MMM dd, yyyy')}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Employee Name</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Jobsite</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Check-in Time</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Check-out Time</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Total Time</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Location</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Distance Flag {/* TODO: Will re-enable later */}</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Flag</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground bg-gray-50/30">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-8 w-8 text-gray-300" />
                        <p className="font-medium">No punch records found</p>
                        <p className="text-sm">for {format(selectedDate, 'MMMM dd, yyyy')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry, index) => {
                    const distanceStatus = getDistanceStatus(entry);
                    
                    return (
                      <TableRow 
                        key={entry.id}
                        className={cn(
                          "border-b border-gray-100 hover:bg-gray-50/50 transition-colors",
                          flaggedEntries.has(entry.id) && 'bg-red-50 border-l-4 border-l-red-500 hover:bg-red-50',
                          index % 2 === 0 && !flaggedEntries.has(entry.id) && 'bg-white',
                          index % 2 === 1 && !flaggedEntries.has(entry.id) && 'bg-gray-50/20'
                        )}
                      >
                        <TableCell className="font-medium py-4 px-6 text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {entry.user_profiles ? 
                                `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 
                                'Unknown Employee'
                              }
                            </span>
                            {entry.check_in_time && (
                              <span className="text-xs text-gray-500 mt-1">
                                {format(new Date(entry.check_in_time), 'EEE, MMM dd')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-gray-700">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            {entry.jobsites?.name || 'Unknown Jobsite'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-gray-700 font-mono text-sm">
                          {entry.check_in_time 
                            ? format(new Date(entry.check_in_time), 'h:mm a')
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell className="py-4 text-gray-700 font-mono text-sm">
                          {entry.check_out_time 
                            ? format(new Date(entry.check_out_time), 'h:mm a')
                            : <span className="text-green-600 font-medium">Still active</span>
                          }
                        </TableCell>
                        <TableCell className="py-4 text-gray-700 font-mono text-sm font-medium">
                          {calculateTotalTime(entry.check_in_time, entry.check_out_time)}
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(entry)}
                        </TableCell>
                        <TableCell className="py-4">
                          {entry.check_in_location ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewLocation(entry)}
                                  className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View punch-in location</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-gray-400 text-sm">No data</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {/* TODO: Will re-add distance status display later */}
                          <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                            Disabled
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleFlag(entry.id)}
                                className={cn(
                                  "p-2 h-8 w-8 transition-colors",
                                  flaggedEntries.has(entry.id) 
                                    ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                                    : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                                )}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{flaggedEntries.has(entry.id) ? 'Remove flag' : 'Flag this record'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            {onEdit && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(entry)}
                                    className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Edit className="h-4 w-4 text-blue-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit punch record</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {onDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete punch record</p>
                                    </TooltipContent>
                                  </Tooltip>
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
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LivePunchTable;
