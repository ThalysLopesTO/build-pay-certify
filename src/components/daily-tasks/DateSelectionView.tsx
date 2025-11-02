import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreateListDialog } from './CreateListDialog';
import { useTaskListMutations } from '@/hooks/daily-tasks/useTaskListMutations';
import { format } from 'date-fns';

interface DateSelectionViewProps {
  jobsiteId: string;
  companyId: string;
}

interface DateInfo {
  date: string;
  dateFormatted: string;
  listCount: number;
  totalTasks: number;
  completedTasks: number;
  creator?: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  };
}

export const DateSelectionView: React.FC<DateSelectionViewProps> = ({
  jobsiteId,
  companyId,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { createList } = useTaskListMutations();

  const { data: dateInfos, isLoading } = useQuery({
    queryKey: ['date-selection', jobsiteId, companyId],
    queryFn: async (): Promise<DateInfo[]> => {
      // Fetch all open lists for this jobsite
      const { data: lists, error: listsError } = await supabase
        .from('daily_task_lists')
        .select(`
          id, 
          for_date,
          creator:user_profiles!created_by (
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('jobsite_id', jobsiteId)
        .eq('company_id', companyId)
        .eq('status', 'open')
        .order('for_date', { ascending: false });

      if (listsError) throw listsError;
      if (!lists || lists.length === 0) return [];

      // Group by date
      const dateMap = new Map<string, { listIds: string[]; creator?: any }>();
      lists.forEach((list: any) => {
        if (!dateMap.has(list.for_date)) {
          dateMap.set(list.for_date, { listIds: [], creator: list.creator });
        }
        dateMap.get(list.for_date)!.listIds.push(list.id);
      });

      // Fetch tasks for all lists
      const allListIds = lists.map((l) => l.id);
      const { data: tasks, error: tasksError } = await supabase
        .from('daily_task_items')
        .select('list_id, is_done')
        .in('list_id', allListIds);

      if (tasksError) throw tasksError;

      // Build date info
      const result: DateInfo[] = [];
      dateMap.forEach((info, date) => {
        const dateTasks = tasks?.filter((t) => info.listIds.includes(t.list_id)) || [];
        const totalTasks = dateTasks.length;
        const completedTasks = dateTasks.filter((t) => t.is_done).length;

        result.push({
          date,
          dateFormatted: format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy'),
          listCount: info.listIds.length,
          totalTasks,
          completedTasks,
          creator: info.creator,
        });
      });

      return result.sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!jobsiteId && !!companyId,
  });

  const handleDateClick = (date: string) => {
    const currentTab = searchParams.get('tab') || 'daily-tasks';
    navigate(`?tab=${currentTab}&jobsiteId=${jobsiteId}&date=${date}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Select a Date</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a date to view and manage daily tasks
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Task List
        </Button>
      </div>

      {/* Date Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !dateInfos || dateInfos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <CalendarDays className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Task Lists Yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Get started by creating your first task list to organize your daily work.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {dateInfos.map((dateInfo) => (
            <Card
              key={dateInfo.date}
              className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => handleDateClick(dateInfo.date)}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {dateInfo.dateFormatted}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {dateInfo.creator && (
                        <>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 ring-1 ring-border">
                              <AvatarImage src={dateInfo.creator.photo_url || undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {dateInfo.creator.first_name?.[0]}{dateInfo.creator.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {dateInfo.creator.first_name} {dateInfo.creator.last_name}
                            </span>
                          </div>
                          <span className="text-muted-foreground">•</span>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {dateInfo.listCount} {dateInfo.listCount === 1 ? 'list' : 'lists'}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">
                        {dateInfo.completedTasks}/{dateInfo.totalTasks} tasks
                      </Badge>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create List Dialog */}
      <CreateListDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(data) => {
          createList.mutate({
            title: data.title,
            jobsite_id: jobsiteId,
            company_id: companyId,
            for_date: data.for_date,
          });
          setIsCreateDialogOpen(false);
        }}
        isLoading={createList.isPending}
      />
    </div>
  );
};
