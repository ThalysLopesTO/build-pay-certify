import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDailyTaskLists } from '@/hooks/daily-tasks/useDailyTaskLists';
import { useListMutations } from '@/hooks/daily-tasks/useListMutations';
import { ArrowLeft, Plus, Calendar, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { CreateListDialog } from './CreateListDialog';

interface JobsiteDailyListsProps {
  jobsiteId: string;
}

export const JobsiteDailyLists = ({ jobsiteId }: JobsiteDailyListsProps) => {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);
  
  const { data: lists, isLoading } = useDailyTaskLists({ jobsiteId });
  const { deleteList } = useListMutations();

  const sortedLists = React.useMemo(() => {
    if (!lists) return [];
    const sorted = [...lists].sort((a, b) => {
      const dateA = new Date(a.for_date).getTime();
      const dateB = new Date(b.for_date).getTime();
      return sortAscending ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  }, [lists, sortAscending]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const jobsiteName = lists?.[0]?.jobsite?.name || 'Jobsite';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/daily-tasks')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{jobsiteName}</h1>
            <p className="text-muted-foreground mt-1">Daily Task Lists</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSortAscending(!sortAscending)}
          >
            {sortAscending ? 'Old → New' : 'New → Old'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
        </div>
      </div>

      {sortedLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Lists Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first daily task list for this jobsite.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedLists.map((list) => (
            <Card key={list.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(list.for_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <CardTitle>{list.title}</CardTitle>
                  </div>
                  <Badge variant={list.status === 'open' ? 'default' : 'secondary'}>
                    {list.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Button asChild variant="outline">
                    <Link to={`/daily-tasks/${jobsiteId}/lists/${list.id}`}>
                      View Tasks
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateListDialog
        jobsiteId={jobsiteId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
