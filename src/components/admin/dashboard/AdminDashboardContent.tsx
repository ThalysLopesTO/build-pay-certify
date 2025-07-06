
import React from 'react';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import EnhancedStatsCard from './EnhancedStatsCard';
import QuickActionsSection from './QuickActionsSection';
import EmployeeLimitCard from './EmployeeLimitCard';
import WelcomeGreeting from './WelcomeGreeting';
import { useComprehensiveDashboardStats } from '@/hooks/useComprehensiveDashboardStats';
import { 
  BarChart3, 
  DollarSign, 
  Receipt, 
  FileText, 
  CheckCircle,
  Building, 
  Calendar, 
  Clock, 
  Users,
  AlertTriangle,
  FileX
} from 'lucide-react';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const { data: stats, isLoading } = useComprehensiveDashboardStats();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Greeting */}
      <WelcomeGreeting />

      {/* Dashboard Title Section */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-muted-foreground mt-1">Professional overview of your company operations</p>
      </div>

      {/* License Warning Banner */}
      <LicenseWarningBanner />

      {/* Employee Limit Card - Prominently displayed */}
      <EmployeeLimitCard />

      {/* FINANCIAL OVERVIEW SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedStatsCard
            title="Total Payroll"
            value={stats?.totalPayroll || 0}
            icon={DollarSign}
            isCurrency={true}
            subtitle="This month"
            isLoading={isLoading}
          />
          <EnhancedStatsCard
            title="Total Expenses"
            value={stats?.totalExpenses || 0}
            icon={Receipt}
            isCurrency={true}
            subtitle="This month"
            isLoading={isLoading}
          />
          <EnhancedStatsCard
            title="Pending Invoices"
            value={stats?.pendingInvoicesCount || 0}
            icon={FileText}
            subtitle={`$${(stats?.pendingInvoicesAmount || 0).toLocaleString()} total`}
            isLoading={isLoading}
            onClick={() => setActiveTab('invoices')}
          />
          <EnhancedStatsCard
            title="Invoices Paid"
            value={stats?.totalInvoicesPaid || 0}
            icon={CheckCircle}
            isCurrency={true}
            subtitle="This month"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* OPERATIONAL OVERVIEW SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Building className="h-5 w-5" />
          Operational Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EnhancedStatsCard
            title="Active Jobsites"
            value={stats?.activeJobsitesCount || 0}
            icon={Building}
            isLoading={isLoading}
            onClick={() => setActiveTab('jobsites')}
          />
          <EnhancedStatsCard
            title="Jobsites Near Deadline"
            value={stats?.jobsitesNearDeadlineCount || 0}
            icon={Calendar}
            isAlert={true}
            alertLevel="warning"
            subtitle="Within 14 days"
            isLoading={isLoading}
            onClick={() => setActiveTab('jobsites')}
          />
          <EnhancedStatsCard
            title="Punch-ins Today"
            value={stats?.punchInsToday || 0}
            icon={Clock}
            isLoading={isLoading}
            onClick={() => setActiveTab('live-punch-monitor')}
          />
        </div>
      </div>

      {/* EMPLOYEE ACTIVITY SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employee Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EnhancedStatsCard
            title="Live Employees Clocked-in"
            value={stats?.liveEmployeesCount || 0}
            icon={Users}
            subtitle="Currently active"
            isLoading={isLoading}
            onClick={() => setActiveTab('live-punch-monitor')}
          />
        </div>
      </div>

      {/* ALERTS SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alerts & Notifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EnhancedStatsCard
            title="Certificates Expiring Soon"
            value={stats?.certificatesExpiringCount || 0}
            icon={AlertTriangle}
            isAlert={true}
            alertLevel="warning"
            subtitle="Within 7 days"
            isLoading={isLoading}
            onClick={() => setActiveTab('employees')}
          />
          <EnhancedStatsCard
            title="Invoices Overdue"
            value={stats?.overdueInvoicesCount || 0}
            icon={FileX}
            isAlert={true}
            alertLevel="danger"
            subtitle="Past 30 days"
            isLoading={isLoading}
            onClick={() => setActiveTab('invoices')}
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsSection setActiveTab={setActiveTab} />
    </div>
  );
};

export default AdminDashboardContent;
