
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, MapPin } from 'lucide-react';

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
  selectedDate,
}) => {
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const showLive = isToday(selectedDate);

  const currentlyClockedIn = filteredEntries.filter((entry) => !entry.check_out_time).length;
  const totalEmployeesToday = filteredEntries.length;
  const activeJobsites = new Set(filteredEntries.map((entry) => entry.jobsite_id)).size;

  const stats = [
    {
      title: selectedDate
        ? isToday(selectedDate)
          ? 'Currently Clocked In'
          : 'Clocked In'
        : 'Currently Clocked In',
      value: currentlyClockedIn,
      description: selectedDate
        ? isToday(selectedDate)
          ? 'Active employees on site'
          : 'Active on selected date'
        : 'Active across all dates',
      icon: Clock,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
    {
      title: selectedDate
        ? isToday(selectedDate)
          ? 'Total Punches Today'
          : 'Total Punches'
        : 'Total Punches',
      value: totalEmployeesToday,
      description: selectedDate
        ? isToday(selectedDate)
          ? 'Punched in today'
          : 'Punched in on selected date'
        : 'All punch records',
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      title: selectedDate
        ? isToday(selectedDate)
          ? 'Active Jobsites'
          : 'Jobsites'
        : 'Jobsites',
      value: activeJobsites,
      description: selectedDate
        ? isToday(selectedDate)
          ? 'Sites with activity'
          : 'Sites with activity on date'
        : 'All sites with activity',
      icon: MapPin,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={index}
            className="border bg-card shadow-sm transition-colors hover:bg-accent/30"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-foreground">
                      {stat.value}
                    </span>
                    {showLive && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}
                >
                  <IconComponent className={`h-4.5 w-4.5 ${stat.iconColor}`} strokeWidth={2.25} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LivePunchSummaryCards;
