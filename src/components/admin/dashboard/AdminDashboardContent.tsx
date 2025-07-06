
import React from 'react';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import StatsCard from './StatsCard';
import QuickActionsSection from './QuickActionsSection';
import EmployeeLimitCard from './EmployeeLimitCard';
import WelcomeGreeting from './WelcomeGreeting';
import ProjectsProgressOverview from './ProjectsProgressOverview';
import LiveActiveEmployees from './LiveActiveEmployees';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { BarChart3 } from 'lucide-react';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Greeting */}
      <WelcomeGreeting />

      {/* Dashboard Title Section */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-black dark:text-white">Dashboard</h1>
        </div>
        <p className="text-muted dark:text-gray-300 mt-1">Welcome to your company admin panel</p>
      </div>

      {/* License Warning Banner */}
      <LicenseWarningBanner />

      {/* Employee Limit Card - Prominently displayed */}
      <EmployeeLimitCard />

      {/* Company Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Active Employees"
          value={stats?.employeesCount || 0}
          icon="👷‍♀️"
          bgColor="bg-slate-50"
          borderColor="border-blue-200"
          iconBg="bg-blue-100"
          isLoading={isLoading}
        />
        <StatsCard
          title="Active Jobsites"
          value={stats?.jobsitesCount || 0}
          icon="🏗️"
          bgColor="bg-slate-50"
          borderColor="border-green-200"
          iconBg="bg-green-100"
          isLoading={isLoading}
        />
        <StatsCard
          title="Pending Invoices"
          value={stats?.invoicesCount || 0}
          icon="📄"
          bgColor="bg-slate-50"
          borderColor="border-orange-200"
          iconBg="bg-orange-100"
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsSection setActiveTab={setActiveTab} />

      {/* New Dashboard Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectsProgressOverview />
        <LiveActiveEmployees />
      </div>
    </div>
  );
};

export default AdminDashboardContent;
