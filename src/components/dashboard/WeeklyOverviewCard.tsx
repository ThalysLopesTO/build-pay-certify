import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, CheckCircle, Clock } from 'lucide-react';

interface WeeklyOverviewCardProps {
  pending: number;
  approved: number;
  total: number;
  isLoading?: boolean;
  theme?: 'green' | 'blue';
}

const themeStyles = {
  green: {
    card: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
    chipPendingBg: 'bg-white/15',
    chipApprovedBg: 'bg-white/15',
    barTrack: 'bg-white/20',
    barFill: 'bg-white',
  },
  blue: {
    card: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white',
    chipPendingBg: 'bg-white/15',
    chipApprovedBg: 'bg-white/15',
    barTrack: 'bg-white/20',
    barFill: 'bg-white',
  },
};

const WeeklyOverviewCard: React.FC<WeeklyOverviewCardProps> = ({
  pending,
  approved,
  total,
  isLoading = false,
  theme = 'green',
}) => {
  const t = themeStyles[theme];
  const progress = total > 0 ? Math.min(Math.round((approved / total) * 100), 100) : 0;

  return (
    <Card className={`shadow-lg border-0 overflow-hidden ${t.card}`}>
      <CardContent className="p-6">
        <div className="space-y-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium opacity-90">This Week's Overview</h3>
              <div className="text-2xl font-bold">
                {isLoading ? 'Loading...' : `${total} items`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${t.chipPendingBg}`}>Pending: {pending}</span>
            <span className={`px-2 py-1 rounded-full ${t.chipApprovedBg} flex items-center gap-1`}>
              <CheckCircle className="h-3 w-3" /> Approved: {approved}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs opacity-90">
              <span>Approved this week</span>
              <span>{progress}%</span>
            </div>
            <div className={`w-full ${t.barTrack} rounded-full h-2`}>
              <div 
                className={`${t.barFill} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyOverviewCard;
