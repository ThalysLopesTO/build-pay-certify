import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
interface DailyTasksSummaryCardsProps {
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  completionPercentage: number;
  isLoading?: boolean;
}
export const DailyTasksSummaryCards: React.FC<DailyTasksSummaryCardsProps> = ({
  totalTasks,
  completedTasks,
  incompleteTasks,
  completionPercentage,
  isLoading = false
}) => {
  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>)}
      </div>;
  }
  const cards = [{
    title: 'Total Tasks',
    value: totalTasks,
    icon: ClipboardList,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-l-4 border-blue-500'
  }, {
    title: 'Completed',
    value: completedTasks,
    icon: CheckCircle2,
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    iconColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-l-4 border-green-500'
  }, {
    title: 'Incomplete',
    value: incompleteTasks,
    icon: AlertCircle,
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-l-4 border-orange-500'
  }];
  return <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(card => <Card key={card.title} className={`${card.borderColor} transition-shadow hover:shadow-md`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>
      
      {totalTasks > 0}
    </div>;
};