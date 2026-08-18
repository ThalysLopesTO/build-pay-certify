import React, { lazy } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

const ManagementDashboardHome = lazy(() => import('@/components/management/ManagementDashboardHome'));
const TimeTracker = lazy(() => import('@/components/employee/TimeTracker'));
const LivePunchMonitor = lazy(() => import('@/components/admin/LivePunchMonitor'));
const ManualTimesheetsPage = lazy(() => import('@/pages/admin/ManualTimesheetsPage'));
const EmployeeBillsManagement = lazy(() => import('@/components/admin/EmployeeBillsManagement'));
const TimeSummaryPage = lazy(() =>
  import('@/components/admin/time-summary/TimeSummaryPage').then((m) => ({ default: m.TimeSummaryPage }))
);
const ManagementTimesheetView = lazy(() => import('@/components/management/ManagementTimesheetView'));
const EmployeeTimesheets = lazy(() => import('@/components/admin/EmployeeTimesheets'));
const PayrollSummary = lazy(() => import('@/components/admin/PayrollSummary'));
const IncomeExpensesManagement = lazy(() => import('@/components/admin/IncomeExpensesManagement'));
const DailyReportsManagement = lazy(() => import('@/components/admin/DailyReportsManagement'));
const EmployeeManagement = lazy(() => import('@/components/admin/EmployeeManagement'));
const EmployeeRegistration = lazy(() => import('@/components/admin/EmployeeRegistration'));
const TimeRequestsManagement = lazy(() => import('@/components/admin/TimeRequestsManagement'));
const InventoryIndex = lazy(() => import('@/pages/admin/inventory/Index'));
const SuppliersManagement = lazy(() => import('@/components/admin/SuppliersManagement'));
const QuotesManagement = lazy(() => import('@/components/admin/QuotesManagement'));
const InvoiceManagement = lazy(() => import('@/components/admin/InvoiceManagement'));
const MyTimesheetHistory = lazy(() => import('@/components/common/MyTimesheetHistory'));
const AttentionReportsInbox = lazy(() => import('@/components/admin/AttentionReportsInbox'));
const ManagementNotifications = lazy(() => import('@/components/management/ManagementNotifications'));
const UserSettings = lazy(() => import('@/components/common/UserSettings'));
const JobsiteSelectionScreen = lazy(() =>
  import('@/components/admin/tasks/JobsiteSelectionScreen').then((m) => ({ default: m.JobsiteSelectionScreen }))
);
const DailyTaskScreen = lazy(() =>
  import('@/components/admin/tasks/DailyTaskScreen').then((m) => ({ default: m.DailyTaskScreen }))
);
const SiteInspectionsPage = lazy(() => import('@/components/admin/site-inspections/SiteInspectionsPage'));

const DashboardRoute = () => {
  const navigate = useNavigate();
  return <ManagementDashboardHome setActiveTab={(tab) => navigate(`/management/${tab}`)} />;
};

const DailyTasksRoute = () => {
  const [searchParams] = useSearchParams();
  return searchParams.get('jobsite') ? <DailyTaskScreen /> : <JobsiteSelectionScreen />;
};

const EmployeesRoute = () => {
  const navigate = useNavigate();
  return <EmployeeManagement onNavigateToRegistration={() => navigate('/management/employee-registration')} />;
};

export interface ManagementTabRoute {
  slug: string;
  title: string;
  element: React.ReactNode;
}

export const managementTabRoutes: ManagementTabRoute[] = [
  { slug: 'dashboard', title: 'Dashboard', element: <DashboardRoute /> },
  { slug: 'time-tracker', title: 'Time Clock', element: <TimeTracker /> },
  { slug: 'live-punch-monitor', title: 'Live Punch Monitor', element: <LivePunchMonitor /> },
  { slug: 'manual-timesheets', title: 'Time Sheet', element: <ManualTimesheetsPage /> },
  { slug: 'site-inspections', title: 'Site Inspections', element: <SiteInspectionsPage /> },
  { slug: 'employee-bills', title: 'Employee Bills', element: <EmployeeBillsManagement /> },
  { slug: 'time-summary', title: 'Time Summary', element: <TimeSummaryPage /> },
  { slug: 'daily-tasks', title: 'Daily Tasks', element: <DailyTasksRoute /> },
  { slug: 'my-timesheet', title: 'My Timesheet', element: <ManagementTimesheetView /> },
  { slug: 'timesheets', title: 'Timesheets', element: <EmployeeTimesheets /> },
  { slug: 'payroll-summary', title: 'Payroll Summary', element: <PayrollSummary /> },
  { slug: 'bills-expenses', title: 'Bills / Expenses', element: <IncomeExpensesManagement /> },
  { slug: 'daily-reports', title: 'Daily Reports', element: <DailyReportsManagement /> },
  { slug: 'employees', title: 'Employees', element: <EmployeesRoute /> },
  { slug: 'employee-registration', title: 'Employee Registration', element: <EmployeeRegistration /> },
  { slug: 'time-requests', title: 'Time Requests', element: <TimeRequestsManagement /> },
  { slug: 'inventory', title: 'Inventory', element: <InventoryIndex /> },
  { slug: 'suppliers', title: 'Suppliers', element: <SuppliersManagement /> },
  { slug: 'quotes', title: 'Quotes', element: <QuotesManagement /> },
  { slug: 'invoices', title: 'Invoices', element: <InvoiceManagement /> },
  { slug: 'my-timesheet-history', title: 'Timesheet History', element: <MyTimesheetHistory /> },
  { slug: 'reports', title: 'Reports', element: <AttentionReportsInbox /> },
  { slug: 'notifications', title: 'Notifications', element: <ManagementNotifications /> },
  { slug: 'settings', title: 'Settings', element: <UserSettings /> },
];

export const managementTabSlugs = new Set(managementTabRoutes.map((r) => r.slug));

export const ManagementDashboardWithLegacyRedirect = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  if (tab && tab !== 'dashboard' && managementTabSlugs.has(tab)) {
    const rest = new URLSearchParams(searchParams);
    rest.delete('tab');
    const qs = rest.toString();
    return <Navigate to={`/management/${tab}${qs ? `?${qs}` : ''}`} replace />;
  }
  return <DashboardRoute />;
};
