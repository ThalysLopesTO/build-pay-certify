
import React from 'react';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import SimpleDashboardCard from './SimpleDashboardCard';
import JobProgressCard from './JobProgressCard';
import WelcomeGreeting from './WelcomeGreeting';
import { useComprehensiveDashboardStats } from '@/hooks/useComprehensiveDashboardStats';
import { 
  CreditCard, 
  FileText, 
  Clock, 
  BarChart3 
} from 'lucide-react';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const { data: stats, isLoading } = useComprehensiveDashboardStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatInvoiceValue = (count: number, amount: number) => {
    if (count === 0) return '0';
    return `${count} - ${formatCurrency(amount)}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Greeting */}
      <WelcomeGreeting />

      {/* Dashboard Title Section */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-muted-foreground mt-1">Key performance indicators at a glance</p>
      </div>

      {/* License Warning Banner */}
      <LicenseWarningBanner />

      {/* Main Dashboard Cards - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenses */}
        <SimpleDashboardCard
          title="Monthly Expenses"
          value={isLoading ? '...' : formatCurrency(stats?.totalExpenses || 0)}
          subtext="This month"
          icon={CreditCard}
          bgColor="bg-dashboard-expense-bg"
          iconColor="bg-dashboard-expense-icon"
          onClick={() => setActiveTab('bills-expenses')}
        />

        {/* Pending Invoices */}
        <SimpleDashboardCard
          title="Pending Invoices"
          value={isLoading ? '...' : formatInvoiceValue(stats?.pendingInvoicesCount || 0, stats?.pendingInvoicesAmount || 0)}
          subtext="Awaiting payment"
          icon={FileText}
          bgColor="bg-dashboard-invoice-bg"
          iconColor="bg-dashboard-invoice-icon"
          onClick={() => setActiveTab('invoices')}
        />

        {/* Live Punch-ins */}
        <SimpleDashboardCard
          title="Live Punch-ins"
          value={isLoading ? '...' : stats?.liveEmployeesCount || 0}
          subtext="Live right now"
          icon={Clock}
          bgColor="bg-dashboard-live-bg"
          iconColor="bg-dashboard-live-icon"
          onClick={() => setActiveTab('live-punch-monitor')}
        />

        {/* Job Progress */}
        <JobProgressCard />
      </div>
    </div>
  );
};

export default AdminDashboardContent;
