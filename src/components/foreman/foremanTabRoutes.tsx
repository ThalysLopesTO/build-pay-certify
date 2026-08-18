import React, { lazy } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

const ForemanDashboardHome = lazy(() => import('@/components/foreman/dashboard/ForemanDashboardHome'));
const TimeTracker = lazy(() => import('@/components/employee/TimeTracker'));
const ForemanTimesheetForm = lazy(() => import('@/components/foreman/ForemanTimesheetForm'));
const MissedPunchRequests = lazy(() => import('@/components/employee/MissedPunchRequests'));
const ManualTimesheetsPage = lazy(() => import('@/pages/admin/ManualTimesheetsPage'));
const MaterialRequestForm = lazy(() => import('@/components/foreman/MaterialRequestForm'));
const MyMaterialRequests = lazy(() => import('@/components/foreman/MyMaterialRequests'));
const EquipmentManagement = lazy(() => import('@/components/admin/inventory/EquipmentManagement'));
const ChangeOrdersPage = lazy(() => import('@/components/admin/ChangeOrdersPage'));
const EmployeeDirectory = lazy(() => import('@/components/foreman/EmployeeDirectory'));
const EmployeeReports = lazy(() => import('@/components/foreman/EmployeeReports'));
const JobsiteProgress = lazy(() => import('@/components/foreman/JobsiteProgress'));
const EmployeeRegistration = lazy(() => import('@/components/admin/EmployeeRegistration'));
const LivePunchMonitor = lazy(() => import('@/components/admin/LivePunchMonitor'));
const CompanyRules = lazy(() => import('@/components/common/CompanyRules'));
const UserSettings = lazy(() => import('@/components/common/UserSettings'));
const MyTimesheetHistory = lazy(() => import('@/components/common/MyTimesheetHistory'));
const ForemanDailyReports = lazy(() => import('@/components/foreman/ForemanDailyReports'));
const TimeSummaryPage = lazy(() =>
  import('@/components/admin/time-summary/TimeSummaryPage').then((m) => ({ default: m.TimeSummaryPage }))
);
const JobsiteSelectionScreen = lazy(() =>
  import('@/components/admin/tasks/JobsiteSelectionScreen').then((m) => ({ default: m.JobsiteSelectionScreen }))
);
const DailyTaskScreen = lazy(() =>
  import('@/components/admin/tasks/DailyTaskScreen').then((m) => ({ default: m.DailyTaskScreen }))
);
const SiteInspectionsPage = lazy(() => import('@/components/admin/site-inspections/SiteInspectionsPage'));

const DashboardRoute = () => {
  const navigate = useNavigate();
  return <ForemanDashboardHome setActiveTab={(tab) => navigate(`/foreman/${tab}`)} />;
};

const DailyTasksRoute = () => {
  const [searchParams] = useSearchParams();
  return searchParams.get('jobsite') ? <DailyTaskScreen /> : <JobsiteSelectionScreen />;
};

export interface ForemanTabRoute {
  slug: string;
  title: string;
  element: React.ReactNode;
}

export const foremanTabRoutes: ForemanTabRoute[] = [
  { slug: 'dashboard', title: 'Dashboard', element: <DashboardRoute /> },
  { slug: 'time-tracker', title: 'Time Clock', element: <TimeTracker /> },
  { slug: 'timesheet', title: 'Timesheet', element: <ForemanTimesheetForm /> },
  { slug: 'missed-punch-requests', title: 'Missed Punch', element: <MissedPunchRequests /> },
  { slug: 'manual-timesheets', title: 'Time Sheet', element: <ManualTimesheetsPage /> },
  { slug: 'site-inspections', title: 'Site Inspections', element: <SiteInspectionsPage /> },
  { slug: 'material-request', title: 'New Material Request', element: <MaterialRequestForm /> },
  { slug: 'my-requests', title: 'My Requests', element: <MyMaterialRequests /> },
  { slug: 'inventory', title: 'Inventory', element: <EquipmentManagement /> },
  { slug: 'change-orders', title: 'Extras / Changes', element: <ChangeOrdersPage /> },
  { slug: 'daily-tasks', title: 'Daily Tasks', element: <DailyTasksRoute /> },
  { slug: 'employees', title: 'Employee Directory', element: <EmployeeDirectory /> },
  { slug: 'employee-registration', title: 'Employee Registration', element: <EmployeeRegistration /> },
  { slug: 'live-punch-monitor', title: 'Live Punch Monitor', element: <LivePunchMonitor /> },
  { slug: 'time-summary', title: 'Time Summary', element: <TimeSummaryPage /> },
  { slug: 'my-timesheet-history', title: 'Timesheet History', element: <MyTimesheetHistory /> },
  { slug: 'daily-reports', title: 'Daily Reports', element: <ForemanDailyReports /> },
  { slug: 'employee-reports', title: 'Employee Reports', element: <EmployeeReports /> },
  { slug: 'jobsite-progress', title: 'Jobsite Progress', element: <JobsiteProgress /> },
  { slug: 'company-rules', title: 'Company Rules', element: <CompanyRules /> },
  { slug: 'settings', title: 'Settings', element: <UserSettings /> },
];

export const foremanTabSlugs = new Set(foremanTabRoutes.map((r) => r.slug));

export const ForemanDashboardWithLegacyRedirect = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  if (tab && tab !== 'dashboard' && foremanTabSlugs.has(tab)) {
    const rest = new URLSearchParams(searchParams);
    rest.delete('tab');
    const qs = rest.toString();
    return <Navigate to={`/foreman/${tab}${qs ? `?${qs}` : ''}`} replace />;
  }
  return <DashboardRoute />;
};
