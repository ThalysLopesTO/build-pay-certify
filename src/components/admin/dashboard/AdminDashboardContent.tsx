
import React from 'react';
import CompanyOverviewCard from './CompanyOverviewCard';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import StatsCard from './StatsCard';
import QuickActionsSection from './QuickActionsSection';
import EmployeeLimitCard from './EmployeeLimitCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome to your company admin panel</p>
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
          icon="👷‍♂️"
          bgColor="bg-green-50"
          isLoading={isLoading}
        />
        <StatsCard
          title="Active Jobsites"
          value={stats?.jobsitesCount || 0}
          icon="🏗️"
          bgColor="bg-blue-50"
          isLoading={isLoading}
        />
        <StatsCard
          title="Pending Invoices"
          value={stats?.invoicesCount || 0}
          icon="📄"
          bgColor="bg-orange-50"
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsSection setActiveTab={setActiveTab} />

      {/* Main content grid */}
      <div className="grid gap-6">
        {/* Company Overview - Full width */}
        <div className="w-full">
          <CompanyOverviewCard />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;
