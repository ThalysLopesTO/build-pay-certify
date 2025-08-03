
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, MapPin, TrendingUp } from 'lucide-react';

interface PunchEntry {
  id: string;
  check_out_time: string | null;
  jobsite_id: string;
}

interface LivePunchSummaryCardsProps {
  filteredEntries: PunchEntry[];
  selectedDate: Date | null;
}

const LivePunchSummaryCards: React.FC<LivePunchSummaryCardsProps> = ({
  filteredEntries,
  selectedDate
}) => {
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const currentlyClockedIn = filteredEntries.filter(entry => !entry.check_out_time).length;
  const totalEmployeesToday = filteredEntries.length;
  const activeJobsites = new Set(filteredEntries.map(entry => entry.jobsite_id)).size;

  const stats = [
    {
      title: selectedDate ? (isToday(selectedDate) ? 'Currently Clocked In' : 'Clocked In') : 'Currently Clocked In (All Time)',
      value: currentlyClockedIn,
      description: selectedDate ? (isToday(selectedDate) ? 'Active employees on site' : 'Active on selected date') : 'Active across all dates',
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      trend: isToday(selectedDate) ? '+12%' : null,
    },
    {
      title: selectedDate ? (isToday(selectedDate) ? 'Total Punches Today' : 'Total Punches') : 'Total Punches (All Time)',
      value: totalEmployeesToday,
      description: selectedDate ? (isToday(selectedDate) ? 'Punched in today' : 'Punched in on selected date') : 'All punch records',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      trend: isToday(selectedDate) ? '+8%' : null,
    },
    {
      title: selectedDate ? (isToday(selectedDate) ? 'Active Jobsites' : 'Jobsites') : 'Jobsites (All Time)',
      value: activeJobsites,
      description: selectedDate ? (isToday(selectedDate) ? 'Sites with activity' : 'Sites with activity on date') : 'All sites with activity',
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      trend: isToday(selectedDate) ? '+5%' : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                {stat.trend && (
                  <div className="flex items-center gap-1 text-sm text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stat.description}
              </p>
              {isToday(selectedDate) && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Live Updates
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LivePunchSummaryCards;
