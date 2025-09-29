
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Flag, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import WorkNoteDisplay from './WorkNoteDisplay';
import EmployeeAvatar from '@/components/ui/employee-avatar';

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
  work_note: string | null;
  status: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
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
  isLoading?: boolean;
}

const LivePunchTable: React.FC<LivePunchTableProps> = ({
  filteredEntries,
  selectedDate,
  flaggedEntries,
  onToggleFlag,
  onViewLocation,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  // TODO: Will re-add distance calculation functions later for jobsite comparison
  
  const getDistanceStatus = (entry: PunchEntry) => {
    // TODO: Will re-implement distance calculation logic later
    // For now, always return null to hide distance status
    return null;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
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
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-md">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Active
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-md">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
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
      <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/70 rounded-full animate-pulse"></div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {isToday(selectedDate) ? "Live Punch Monitor" : `Punch Records - ${format(selectedDate, 'MMM dd, yyyy')}`}
            </div>
            {isToday(selectedDate) && (
              <Badge variant="outline" className="ml-auto bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/50 hover:from-muted/90 hover:to-muted/60 border-b border-border/50">
                  <TableHead className="font-bold text-foreground py-6 px-6">Employee</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Jobsite</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Check-in</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Check-out</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Duration</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Status</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Note</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Location</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Distance</TableHead>
                  <TableHead className="font-bold text-foreground py-6">Flag</TableHead>
                  <TableHead className="font-bold text-foreground py-6 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/10">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Clock className="h-8 w-8 text-muted-foreground/60" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-lg text-foreground">No punch records found</p>
                          <p className="text-sm text-muted-foreground">for {format(selectedDate, 'MMMM dd, yyyy')}</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry, index) => {
                    const distanceStatus = getDistanceStatus(entry);
                    const isEven = index % 2 === 0;
                    
                    return (
                      <TableRow 
                        key={entry.id}
                        className={cn(
                          "border-b border-border/30 hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/10 transition-all duration-200 group",
                          flaggedEntries.has(entry.id) && 'bg-gradient-to-r from-destructive/10 to-destructive/5 border-l-4 border-l-destructive hover:from-destructive/15 hover:to-destructive/8',
                          !flaggedEntries.has(entry.id) && (isEven ? 'bg-background' : 'bg-muted/20')
                        )}
                      >
                        <TableCell className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <EmployeeAvatar
                              photoUrl={entry.user_profiles?.photo_url}
                              firstName={entry.user_profiles?.first_name}
                              lastName={entry.user_profiles?.last_name}
                              size="md"
                              className="shadow-sm border-2 border-background group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="flex flex-col space-y-1">
                              <span className="font-bold text-lg text-foreground">
                                {entry.user_profiles ? 
                                  `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 
                                  'Unknown Employee'
                                }
                              </span>
                              {entry.check_in_time && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(entry.check_in_time), 'EEE, MMM dd')}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full shadow-sm"></div>
                            <span className="font-semibold text-foreground">
                              {entry.jobsites?.name || 'Unknown Jobsite'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-sm font-bold text-foreground">
                              {entry.check_in_time 
                                ? format(new Date(entry.check_in_time), 'h:mm a')
                                : 'N/A'
                              }
                            </span>
                            {entry.check_in_time && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.check_in_time), 'MMM dd')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          {entry.check_out_time ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-sm font-bold text-foreground">
                                {format(new Date(entry.check_out_time), 'h:mm a')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.check_out_time), 'MMM dd')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-600 font-bold text-sm">Active Now</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-mono text-sm font-bold text-foreground">
                              {calculateTotalTime(entry.check_in_time, entry.check_out_time)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          {getStatusBadge(entry)}
                        </TableCell>
                        <TableCell className="py-6 text-center">
                          <WorkNoteDisplay note={entry.work_note} variant="icon" />
                        </TableCell>
                        <TableCell className="py-6">
                          {entry.check_in_location ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewLocation(entry)}
                                  className="p-3 h-10 w-10 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-full hover:scale-105"
                                >
                                  <MapPin className="h-5 w-5 text-blue-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View punch-in location</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm font-medium">No location</span>
                          )}
                        </TableCell>
                        <TableCell className="py-6">
                          <Badge variant="outline" className="text-xs font-medium bg-muted/50 border-muted-foreground/30">
                            Disabled
                          </Badge>
                        </TableCell>
                        <TableCell className="py-6">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleFlag(entry.id)}
                                className={cn(
                                  "p-3 h-10 w-10 transition-all duration-200 rounded-full hover:scale-105",
                                  flaggedEntries.has(entry.id) 
                                    ? "text-red-600 hover:text-red-700 hover:bg-red-50 bg-red-50/50" 
                                    : "text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                )}
                              >
                                <Flag className="h-5 w-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{flaggedEntries.has(entry.id) ? 'Remove flag' : 'Flag this record'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <div className="flex items-center gap-2">
                            {onEdit && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(entry)}
                                    className="p-3 h-10 w-10 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-full hover:scale-105"
                                  >
                                    <Edit className="h-5 w-5 text-blue-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit punch record</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {onDelete && (
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-3 h-10 w-10 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-full hover:scale-105"
                                      >
                                        <Trash2 className="h-5 w-5 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete punch record</p>
                                  </TooltipContent>
                                </Tooltip>
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
