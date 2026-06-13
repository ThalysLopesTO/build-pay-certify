// Central registry of all admin destinations.
// Each slug doubles as the legacy ?tab= value, so old links
// (/admin/dashboard?tab=invoices) map 1:1 onto routes (/admin/invoices).
import React, { lazy } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

// Route-level code splitting: each admin page loads on demand instead of
// shipping in one bundle. AdminLayout wraps the Outlet in <Suspense>.
const AdminDashboardContent = lazy(() => import('@/components/admin/dashboard/AdminDashboardContent'));
const EmployeeManagement = lazy(() => import('@/components/admin/EmployeeManagement'));
const EmployeeRegistration = lazy(() => import('@/components/admin/EmployeeRegistration'));
const JobsiteManagement = lazy(() => import('@/components/admin/JobsiteManagement'));
const SafetyTemplatesManagement = lazy(() => import('@/components/admin/SafetyTemplatesManagement'));
const InventoryIndex = lazy(() => import('@/pages/admin/inventory/Index'));
const SuppliersManagement = lazy(() => import('@/components/admin/SuppliersManagement'));
const LivePunchMonitor = lazy(() => import('@/components/admin/LivePunchMonitor'));
const EmployeeTimesheets = lazy(() => import('@/components/admin/EmployeeTimesheets'));
const PayrollSummary = lazy(() => import('@/components/admin/PayrollSummary'));
const MaterialRequestInbox = lazy(() => import('@/components/admin/MaterialRequestInbox'));
const ChangeOrdersPage = lazy(() => import('@/components/admin/ChangeOrdersPage'));
const MaterialTakeoffManagement = lazy(() => import('@/components/admin/MaterialTakeoffManagement'));
const AttentionReportsInbox = lazy(() => import('@/components/admin/AttentionReportsInbox'));
const DailyReportsManagement = lazy(() => import('@/components/admin/DailyReportsManagement'));
const InvoiceManagement = lazy(() => import('@/components/admin/InvoiceManagement'));
const QuotesManagement = lazy(() => import('@/components/admin/QuotesManagement'));
const UserSettings = lazy(() => import('@/components/common/UserSettings'));
const SystemSettings = lazy(() => import('@/components/admin/SystemSettings'));
const IncomeExpensesManagement = lazy(() => import('@/components/admin/IncomeExpensesManagement'));
const TimeRequestsManagement = lazy(() => import('@/components/admin/TimeRequestsManagement'));
const TimeSummaryPage = lazy(() =>
  import('@/components/admin/time-summary/TimeSummaryPage').then((m) => ({ default: m.TimeSummaryPage }))
);
const JobsiteSelectionScreen = lazy(() =>
  import('@/components/admin/tasks/JobsiteSelectionScreen').then((m) => ({ default: m.JobsiteSelectionScreen }))
);
const DailyTaskScreen = lazy(() =>
  import('@/components/admin/tasks/DailyTaskScreen').then((m) => ({ default: m.DailyTaskScreen }))
);
const ClientsPage = lazy(() => import('@/pages/admin/ClientsPage'));
const ManualTimesheetsPage = lazy(() => import('@/pages/admin/ManualTimesheetsPage'));
const EmployeeBillsManagement = lazy(() => import('@/components/admin/EmployeeBillsManagement'));
const JobCostingPage = lazy(() => import('@/components/admin/JobCostingPage'));
const ChatPage = lazy(() => import('@/components/chat/ChatPage'));

const DashboardRoute = () => {
  const navigate = useNavigate();
  return <AdminDashboardContent setActiveTab={(tab) => navigate(`/admin/${tab}`)} />;
};

const EmployeesRoute = () => {
  const navigate = useNavigate();
  return <EmployeeManagement onNavigateToRegistration={() => navigate('/admin/employee-registration')} />;
};

const TasksRoute = () => {
  const [searchParams] = useSearchParams();
  return searchParams.get('jobsite') ? <DailyTaskScreen /> : <JobsiteSelectionScreen />;
};

export interface AdminTabRoute {
  /** URL slug under /admin/ — identical to the legacy ?tab= value */
  slug: string;
  title: string;
  element: React.ReactNode;
}

export const adminTabRoutes: AdminTabRoute[] = [
  { slug: 'dashboard', title: 'Dashboard', element: <DashboardRoute /> },
  { slug: 'employees', title: 'Employee Management', element: <EmployeesRoute /> },
  { slug: 'employee-registration', title: 'Employee Registration', element: <EmployeeRegistration /> },
  { slug: 'jobsites', title: 'Jobsite Management', element: <JobsiteManagement /> },
  { slug: 'safety-templates', title: 'Safety Templates', element: <SafetyTemplatesManagement /> },
  { slug: 'inventory', title: 'Inventory', element: <InventoryIndex /> },
  { slug: 'suppliers', title: 'Suppliers', element: <SuppliersManagement /> },
  { slug: 'live-punch-monitor', title: 'Live Punch Monitor', element: <LivePunchMonitor /> },
  { slug: 'manual-timesheets', title: 'Time Sheet', element: <ManualTimesheetsPage /> },
  { slug: 'employee-bills', title: 'Employee Bills', element: <EmployeeBillsManagement /> },
  { slug: 'time-summary', title: 'Time Summary', element: <TimeSummaryPage /> },
  { slug: 'timesheets', title: 'Timesheets', element: <EmployeeTimesheets /> },
  { slug: 'payroll-summary', title: 'Payroll Summary', element: <PayrollSummary /> },
  { slug: 'material-requests', title: 'Material Requests', element: <MaterialRequestInbox /> },
  { slug: 'change-orders', title: 'Extras / Changes', element: <ChangeOrdersPage /> },
  { slug: 'material-takeoff', title: 'Material Takeoffs', element: <MaterialTakeoffManagement /> },
  { slug: 'daily-reports', title: 'Daily Reports', element: <DailyReportsManagement /> },
  { slug: 'attention-reports', title: 'Attention Reports', element: <AttentionReportsInbox /> },
  { slug: 'invoices', title: 'Invoices', element: <InvoiceManagement /> },
  { slug: 'quotes', title: 'Quotes', element: <QuotesManagement /> },
  { slug: 'clients', title: 'Clients', element: <ClientsPage /> },
  { slug: 'bills-expenses', title: 'Bills / Expenses', element: <IncomeExpensesManagement /> },
  { slug: 'job-costing', title: 'Job Costing / P&L', element: <JobCostingPage /> },
  { slug: 'time-requests', title: 'Time Requests', element: <TimeRequestsManagement /> },
  { slug: 'tasks', title: 'Daily Tasks', element: <TasksRoute /> },
  { slug: 'company-settings', title: 'Company Settings', element: <SystemSettings /> },
  { slug: 'settings', title: 'User Settings', element: <UserSettings /> },
  { slug: 'chat', title: 'Team Chat', element: <ChatPage /> },
];

export const adminTabSlugs = new Set(adminTabRoutes.map((r) => r.slug));

/**
 * Backwards compatibility: links stored in notifications and emails still use
 * /admin/dashboard?tab=<slug>. Redirect those to /admin/<slug>, carrying any
 * extra query params (e.g. ?tab=tasks&jobsite=123 → /admin/tasks?jobsite=123).
 */
export const AdminDashboardWithLegacyRedirect = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  if (tab && tab !== 'dashboard' && adminTabSlugs.has(tab)) {
    const rest = new URLSearchParams(searchParams);
    rest.delete('tab');
    const qs = rest.toString();
    return <Navigate to={`/admin/${tab}${qs ? `?${qs}` : ''}`} replace />;
  }
  return <DashboardRoute />;
};
