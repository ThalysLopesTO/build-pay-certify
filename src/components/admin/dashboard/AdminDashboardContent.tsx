import React from 'react';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import StatsCard from './StatsCard';
import QuickActionsSection from './QuickActionsSection';
import EmployeeLimitCard from './EmployeeLimitCard';
import WelcomeGreeting from './WelcomeGreeting';
import ProjectsProgressOverview from './ProjectsProgressOverview';
import LiveActiveEmployees from './LiveActiveEmployees';
import { useEnhancedDashboardStats } from '@/hooks/useEnhancedDashboardStats';
import { useEmployees } from '@/contexts/EmployeeContext';
import { BarChart3 } from 'lucide-react';
interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}
const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  setActiveTab
}) => {
  const {
    data: stats,
    isLoading
  } = useEnhancedDashboardStats();
  
  // Get real-time employee count from context
  const { activeEmployeeCount } = useEmployees();

  // Handler for card clicks
  const navigateToSection = (section: string) => {
    setActiveTab(section);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome Greeting */}
      <WelcomeGreeting />

      {/* Dashboard Title Section */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <p className="mt-1 text-slate-950">Welcome to your company admin panel</p>
      </div>

      {/* License Warning Banner */}
      <LicenseWarningBanner />

      {/* Employee Limit Card - Prominently displayed */}
      <EmployeeLimitCard />

      {/* Company Overview Stats Cards - Enhanced with more KPIs in 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* First Row - Basic KPIs */}
        <StatsCard 
          title="Active Employees" 
          value={activeEmployeeCount || 0} 
          icon="👷‍♂️" 
          bgColor="bg-slate-50" 
          borderColor="border-blue-200" 
          iconBg="bg-blue-100" 
          isLoading={isLoading}
          onClick={() => navigateToSection('employees')}
        />
        <StatsCard 
          title="Active Jobsites" 
          value={stats?.jobsitesCount || 0} 
          icon="🏗️" 
          bgColor="bg-slate-50" 
          borderColor="border-green-200" 
          iconBg="bg-green-100" 
          isLoading={isLoading}
          onClick={() => navigateToSection('jobsites')}
        />
        <StatsCard 
          title="Pending Invoices" 
          value={stats?.invoicesCount || 0} 
          icon="📄" 
          bgColor="bg-slate-50" 
          borderColor="border-orange-200" 
          iconBg="bg-orange-100" 
          isLoading={isLoading}
          onClick={() => navigateToSection('invoices')}
        />
        <StatsCard 
          title="Total Hours This Week" 
          value={stats?.totalHoursThisWeek || 0} 
          icon="⏱️" 
          bgColor="bg-slate-50" 
          borderColor="border-blue-200" 
          iconBg="bg-blue-100" 
          isLoading={isLoading}
          onClick={() => navigateToSection('timesheets')}
        />
        
        {/* Second Row - Enhanced KPIs */}
        <StatsCard 
          title="Overdue Invoices" 
          value={stats?.overdueInvoicesCount || 0} 
          icon="⚠️" 
          bgColor="bg-slate-50" 
          borderColor="border-red-200" 
          iconBg="bg-red-100" 
          isLoading={isLoading}
          onClick={() => navigateToSection('invoices')}
        />
        <StatsCard 
          title="Jobsites Near Completion" 
          value={stats?.jobsitesNearCompletion || 0} 
          icon="🏁" 
          bgColor="bg-slate-50" 
          borderColor="border-green-200" 
          iconBg="bg-green-100" 
          isLoading={isLoading}
          onClick={() => navigateToSection('jobsites')}
        />
        <StatsCard 
          title="Timesheets (Last 7 Days)" 
          value={stats?.timesheetsCount || 0} 
          icon="📅" 
          bgColor="bg-slate-50" 
          borderColor="border-purple-200" 
          iconBg="bg-purple-100" 
          isLoading={isLoading}
          onClick={() => navigateToSection('timesheets')}
        />
      </div>

      {/* Quick Actions Panel - Enhanced */}
      <QuickActionsSection setActiveTab={setActiveTab} />

      {/* Project Progress and Live Punch-ins - Preserved as requested */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectsProgressOverview />
        <LiveActiveEmployees />
      </div>
    </div>
  );
};
export default AdminDashboardContent;