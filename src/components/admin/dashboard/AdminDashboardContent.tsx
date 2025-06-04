
import React, { useState } from 'react';
import { Building, Users, FileText, Calendar } from 'lucide-react';
import CompanyOverviewCard from './CompanyOverviewCard';
import StatsCard from './StatsCard';
import QuickActionsSection from './QuickActionsSection';
import LicenseDetailsModal from './LicenseDetailsModal';
import { useDashboardStats } from '@/hooks/useDashboardStats';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const { data: stats, isLoading } = useDashboardStats();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'jobsite':
        setActiveTab('jobsite-management');
        break;
      case 'employee':
        setActiveTab('employee-registration');
        break;
      case 'invoice':
        setActiveTab('invoice-management');
        break;
      case 'license':
        setShowLicenseModal(true);
        break;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome to your company admin panel</p>
      </div>

      {/* Company Overview */}
      <CompanyOverviewCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="🏗️ Active Job Sites"
          count={stats?.jobsitesCount || 0}
          icon={Building}
          description="Total registered jobsites"
          onClick={() => setActiveTab('jobsite-management')}
          loading={isLoading}
        />
        
        <StatsCard
          title="👷 Registered Employees"
          count={stats?.employeesCount || 0}
          icon={Users}
          description="Company team members"
          onClick={() => setActiveTab('employee-management')}
          loading={isLoading}
        />
        
        <StatsCard
          title="💼 Weekly Timesheets"
          count={stats?.timesheetsCount || 0}
          icon={Calendar}
          description="Submitted in last 7 days"
          onClick={() => setActiveTab('employee-timesheets')}
          loading={isLoading}
        />
        
        <StatsCard
          title="💰 Invoices This Month"
          count={stats?.invoicesCount || 0}
          icon={FileText}
          description="Generated this month"
          onClick={() => setActiveTab('invoice-management')}
          loading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActionsSection
            onAddJobsite={() => handleQuickAction('jobsite')}
            onAddEmployee={() => handleQuickAction('employee')}
            onCreateInvoice={() => handleQuickAction('invoice')}
            onViewLicense={() => handleQuickAction('license')}
          />
        </div>
      </div>

      {/* License Details Modal */}
      <LicenseDetailsModal
        open={showLicenseModal}
        onOpenChange={setShowLicenseModal}
      />
    </div>
  );
};

export default AdminDashboardContent;
