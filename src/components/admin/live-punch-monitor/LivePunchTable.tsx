
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Flag, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import WorkNoteDisplay from './WorkNoteDisplay';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { RuleBasedHours, RuleBasedHoursCell } from './RuleBasedHours';
import { useAuth } from '@/contexts/SupabaseAuthContext';

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
  break_minutes?: number | null;
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
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  // Selection props
  selectionEnabled?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  allVisibleSelected?: boolean;
}

const LivePunchTable: React.FC<LivePunchTableProps> = ({
  filteredEntries,
  selectedDate,
  flaggedEntries,
  onToggleFlag,
  onViewLocation,
  onEdit,
  onDelete,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  selectionEnabled = false,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected = false,
}) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  

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

  const formatBreakTime = (minutes: number | null | undefined): string => {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
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
          {isMobile ? (
            // Mobile Card Layout
            <div className="p-3 space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-muted/20 to-muted/10 rounded-lg mx-2">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Clock className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-base text-foreground">No punch records found</p>
                      <p className="text-xs text-muted-foreground">for {format(selectedDate, 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                filteredEntries.map((entry, index) => (
                  <Card 
                    key={entry.id}
                    className={cn(
                      "overflow-hidden transition-all duration-200 hover:shadow-md border",
                      flaggedEntries.has(entry.id) 
                        ? 'border-l-4 border-l-destructive bg-gradient-to-r from-destructive/10 to-destructive/5' 
                        : 'border-border/50'
                    )}
                  >
                    <CardContent className="p-3 space-y-3">
                      {/* Employee Header */}
                      <div className="flex items-start gap-3">
                        <EmployeeAvatar
                          photoUrl={entry.user_profiles?.photo_url}
                          firstName={entry.user_profiles?.first_name}
                          lastName={entry.user_profiles?.last_name}
                          size="md"
                          className="shadow-sm border border-border/50 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-bold text-sm text-foreground leading-tight truncate">
                            {entry.user_profiles ? 
                              `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 
                              'Unknown Employee'
                            }
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex-shrink-0"></div>
                            <span className="text-xs font-medium text-muted-foreground truncate">
                              {entry.jobsites?.name || 'Unknown Jobsite'}
                            </span>
                          </div>
                          {entry.check_in_time && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.check_in_time), 'EEE, MMM dd')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status and Flag Row */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/30">
                        {getStatusBadge(entry)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleFlag(entry.id)}
                          className={cn(
                            "p-1.5 h-7 w-7 transition-all duration-200 flex-shrink-0",
                            flaggedEntries.has(entry.id) 
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50 bg-red-50/50" 
                              : "text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          )}
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Time Information Grid */}
                      <div className="grid grid-cols-4 gap-2 p-2.5 bg-muted/30 rounded-md">
                        <div className="text-center space-y-1">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">In</p>
                          <p className="font-mono text-xs font-bold text-foreground leading-tight">
                            {entry.check_in_time 
                              ? format(new Date(entry.check_in_time), 'h:mm a')
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="text-center space-y-1 border-x border-border/30">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Out</p>
                          {entry.check_out_time ? (
                            <p className="font-mono text-xs font-bold text-foreground leading-tight">
                              {format(new Date(entry.check_out_time), 'h:mm a')}
                            </p>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-600 font-bold text-[10px] uppercase">Live</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center space-y-1 border-r border-border/30">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Worked</p>
                          <div className="flex items-center justify-center gap-0.5">
                            <Clock className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                            <span className="font-mono text-xs font-bold text-foreground leading-tight">
                              {calculateTotalTime(entry.check_in_time, entry.check_out_time)}
                            </span>
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Break</p>
                          <span className="font-mono text-xs font-bold text-muted-foreground leading-tight">
                            {formatBreakTime(entry.break_minutes)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <WorkNoteDisplay note={entry.work_note} variant="icon" />
                          {entry.check_in_location ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewLocation(entry)}
                                  className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                >
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">View Location</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="p-2 h-8 w-8 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        
                        {/* Edit and Delete Actions */}
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(entry)}
                                  className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Edit Record</p>
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
                                      className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Delete Record</p>
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-base">Delete Punch Record</AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm">
                                    Are you sure you want to delete this punch record for{' '}
                                    <strong className="text-foreground">
                                      {entry.user_profiles 
                                        ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` 
                                        : 'Unknown Employee'
                                      }
                                    </strong>
                                    ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="m-0">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(entry)}
                                    className="bg-red-600 hover:bg-red-700 m-0"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            // Desktop Table Layout
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/80 to-muted/50 hover:from-muted/90 hover:to-muted/60 border-b border-border/50">
                    <TableHead className="font-bold text-foreground py-6 px-6">Employee</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Jobsite</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Check-in</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Check-out</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Worked Duration</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Break Time</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Status</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Note</TableHead>
                    <TableHead className="font-bold text-foreground py-6">Location</TableHead>
                    
                    <TableHead className="font-bold text-foreground py-6">Flag</TableHead>
                    <TableHead className="font-bold text-foreground py-6 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/10">
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
                            <span className="font-mono text-sm font-medium text-muted-foreground">
                              {formatBreakTime(entry.break_minutes)}
                            </span>
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
          )}
          
          {/* Pagination */}
          {(totalPages > 1 || totalItems > itemsPerPage) && onPageChange && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 to-muted/10">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="hover:bg-primary/10 hover:text-primary h-8 px-2 sm:px-3 text-xs"
                >
                  Prev
                </Button>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {(() => {
                    const maxVisible = isMobile ? 3 : 7;
                    
                    if (totalPages <= maxVisible) {
                      // Show all pages if within limit
                      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => onPageChange(page)}
                          className={cn(
                            "min-w-[28px] sm:min-w-[32px] h-8 p-0 text-xs",
                            currentPage === page 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "hover:bg-primary/10 hover:text-primary"
                          )}
                        >
                          {page}
                        </Button>
                      ));
                    } else {
                      // Show condensed pagination
                      const pages = [];
                      const showFirst = currentPage > 2;
                      const showLast = currentPage < totalPages - 1;
                      
                      if (showFirst) {
                        pages.push(
                          <Button
                            key={1}
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            className="min-w-[28px] sm:min-w-[32px] h-8 p-0 text-xs hover:bg-primary/10 hover:text-primary"
                          >
                            1
                          </Button>
                        );
                        if (currentPage > 3) {
                          pages.push(<span key="dots1" className="px-1 text-muted-foreground text-xs">...</span>);
                        }
                      }
                      
                      // Show current page and neighbors
                      const start = Math.max(1, currentPage - 1);
                      const end = Math.min(totalPages, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onPageChange(i)}
                            className={cn(
                              "min-w-[28px] sm:min-w-[32px] h-8 p-0 text-xs",
                              currentPage === i 
                                ? "bg-primary text-primary-foreground shadow-sm" 
                                : "hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            {i}
                          </Button>
                        );
                      }
                      
                      if (showLast) {
                        if (currentPage < totalPages - 2) {
                          pages.push(<span key="dots2" className="px-1 text-muted-foreground text-xs">...</span>);
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            variant="ghost"
                            size="sm"
                            onClick={() => onPageChange(totalPages)}
                            className="min-w-[28px] sm:min-w-[32px] h-8 p-0 text-xs hover:bg-primary/10 hover:text-primary"
                          >
                            {totalPages}
                          </Button>
                        );
                      }
                      
                      return pages;
                    }
                  })()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="hover:bg-primary/10 hover:text-primary h-8 px-2 sm:px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LivePunchTable;
