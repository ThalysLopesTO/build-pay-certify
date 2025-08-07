import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useWorkWeek } from '@/hooks/useWorkWeek';
import { useExistingTimesheets } from '@/hooks/useExistingTimesheets';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ForemanTimesheetDetailModal from './ForemanTimesheetDetailModal';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format, addDays } from 'date-fns';

interface WeeklyTimesheetBlock {
  week: {
    startDate: Date;
    endDate: Date;
    rangeFormatted: string;
    weekStartDateString: string;
    label: string;
    isCurrent: boolean;
  };
  jobsite?: string;
  totalHours: number;
  previewPay: number;
  isSubmitted: boolean;
}

const ForemanWeeklyTimesheetView = () => {
  const { user } = useAuth();
  const workWeeks = useWorkWeek();
  const { data: existingTimesheets = [] } = useExistingTimesheets();
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hourlyRate = parseFloat(user?.user_metadata?.hourly_rate || '25');

  // Create timesheet blocks for the last 3 weeks
  const timesheetBlocks: WeeklyTimesheetBlock[] = workWeeks?.availableWeeks.map(week => {
    const isSubmitted = existingTimesheets.includes(week.weekStartDateString);
    
    return {
      week,
      jobsite: isSubmitted ? 'Selected Site' : undefined, // This would come from actual data
      totalHours: isSubmitted ? 40 : 0, // This would come from actual data
      previewPay: isSubmitted ? (40 * hourlyRate) : 0,
      isSubmitted,
    };
  }) || [];

  const handleWeekClick = (block: WeeklyTimesheetBlock) => {
    setSelectedWeek(block.week);
    setIsModalOpen(true);
  };

  if (!workWeeks) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading work week configuration...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { settings } = useCompanySettings();
  const isBiWeekly = (settings as any)?.timesheet_frequency === 'bi-weekly';
  const headerTitle = isBiWeekly ? 'Bi-Weekly Timesheet Submission' : 'Weekly Timesheet Submission';
  const currentStartDate = workWeeks?.currentWeek?.startDate as Date | undefined;
  const headerSubtitle = currentStartDate
    ? `${format(currentStartDate, 'MMM dd')} – ${format(addDays(currentStartDate, isBiWeekly ? 13 : 6), 'MMM dd')}`
    : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>{headerTitle}</span>
            </span>
            {headerSubtitle && (
              <span className="text-sm text-muted-foreground">{headerSubtitle}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timesheetBlocks.map((block) => (
              <Button
                key={block.week.weekStartDateString}
                variant="outline"
                className="h-auto p-6 flex flex-col items-start space-y-3 hover:shadow-md transition-all duration-200"
                onClick={() => handleWeekClick(block)}
              >
                {/* Week Range */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-base">
                    {block.week.rangeFormatted}
                  </span>
                  {block.isSubmitted ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Week Label */}
                <Badge 
                  variant={block.week.isCurrent ? "default" : "secondary"}
                  className={block.week.isCurrent ? "bg-orange-100 text-orange-800" : ""}
                >
                  {block.week.label}
                </Badge>

                {/* Jobsite */}
                <div className="w-full text-left">
                  <p className="text-sm text-gray-600 mb-1">Jobsite:</p>
                  <p className="font-medium text-sm">
                    {block.jobsite || 'Not selected'}
                  </p>
                </div>

                {/* Hours and Pay */}
                <div className="w-full grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Hours</p>
                    <p className="font-bold text-blue-600">{block.totalHours}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Preview Pay</p>
                    <p className="font-bold text-green-600">${block.previewPay.toFixed(2)}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="w-full">
                  <Badge 
                    variant={block.isSubmitted ? "default" : "outline"}
                    className={block.isSubmitted 
                      ? "bg-green-100 text-green-800 border-green-300" 
                      : "text-orange-800 border-orange-300"
                    }
                  >
                    {block.isSubmitted ? 'Submitted' : 'Pending'}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Week Summary */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-lg">Weekly Summary</h3>
                <p className="text-sm text-gray-600">Review your timesheet submissions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total this week</p>
              <p className="text-2xl font-bold text-orange-600">
                {timesheetBlocks.find(b => b.week.isCurrent)?.totalHours || 0} hrs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <ForemanTimesheetDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedWeek={selectedWeek}
        existingTimesheets={existingTimesheets}
      />
    </div>
  );
};

export default ForemanWeeklyTimesheetView;