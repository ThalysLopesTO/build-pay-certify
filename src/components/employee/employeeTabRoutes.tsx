import React, { lazy } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

const EmployeeDashboardHome = lazy(() => import('@/components/employee/EmployeeDashboardHome'));
const TimeTracker = lazy(() => import('@/components/employee/TimeTracker'));
const TimesheetForm = lazy(() => import('@/components/employee/TimesheetForm'));
const MissedPunchRequests = lazy(() => import('@/components/employee/MissedPunchRequests'));
const AttentionReportForm = lazy(() => import('@/components/employee/AttentionReportForm'));
const MyReports = lazy(() => import('@/components/employee/MyReports'));
const CertificateStatus = lazy(() => import('@/components/employee/CertificateStatus'));
const CompanyRules = lazy(() => import('@/components/common/CompanyRules'));
const UserSettings = lazy(() => import('@/components/common/UserSettings'));
const JobsiteSelectionScreen = lazy(() =>
  import('@/components/admin/tasks/JobsiteSelectionScreen').then((m) => ({ default: m.JobsiteSelectionScreen }))
);
const DailyTaskScreen = lazy(() =>
  import('@/components/admin/tasks/DailyTaskScreen').then((m) => ({ default: m.DailyTaskScreen }))
);

const DashboardRoute = () => {
  const navigate = useNavigate();
  return <EmployeeDashboardHome onNavigateToTab={(tab) => navigate(`/employee/${tab}`)} />;
};

const TasksRoute = () => {
  const [searchParams] = useSearchParams();
  return searchParams.get('jobsite') ? <DailyTaskScreen /> : <JobsiteSelectionScreen />;
};

export interface EmployeeTabRoute {
  slug: string;
  title: string;
  element: React.ReactNode;
}

export const employeeTabRoutes: EmployeeTabRoute[] = [
  { slug: 'dashboard', title: 'Home', element: <DashboardRoute /> },
  { slug: 'tasks', title: 'Tasks', element: <TasksRoute /> },
  { slug: 'time-tracker', title: 'Time Clock', element: <TimeTracker /> },
  { slug: 'timesheet', title: 'Timesheets', element: <TimesheetForm /> },
  { slug: 'missed-punch-requests', title: 'Missed Punch', element: <MissedPunchRequests /> },
  { slug: 'attention-report', title: 'Report Issue', element: <AttentionReportForm /> },
  { slug: 'my-reports', title: 'My Reports', element: <MyReports /> },
  { slug: 'certificates', title: 'Certificates', element: <CertificateStatus /> },
  { slug: 'company-rules', title: 'Company Rules', element: <CompanyRules /> },
  { slug: 'settings', title: 'Profile', element: <UserSettings /> },
];

export const employeeTabSlugs = new Set(employeeTabRoutes.map((r) => r.slug));

export const EmployeeDashboardWithLegacyRedirect = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  // also handle 'daily-tasks' alias
  const resolved = tab === 'daily-tasks' ? 'tasks' : tab;
  if (resolved && resolved !== 'dashboard' && employeeTabSlugs.has(resolved)) {
    const rest = new URLSearchParams(searchParams);
    rest.delete('tab');
    const qs = rest.toString();
    return <Navigate to={`/employee/${resolved}${qs ? `?${qs}` : ''}`} replace />;
  }
  return <DashboardRoute />;
};
