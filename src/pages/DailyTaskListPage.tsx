import React from 'react';
import { useParams } from 'react-router-dom';
import { DailyTaskListView } from '@/components/daily-tasks/DailyTaskListView';

const DailyTaskListPage = () => {
  const { jobsiteId, listId } = useParams<{ jobsiteId: string; listId: string }>();

  if (!jobsiteId || !listId) {
    return <div>Invalid URL</div>;
  }

  return <DailyTaskListView jobsiteId={jobsiteId} listId={listId} />;
};

export default DailyTaskListPage;
