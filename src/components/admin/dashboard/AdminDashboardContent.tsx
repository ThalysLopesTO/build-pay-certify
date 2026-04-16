import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  DollarSign,
  Receipt,
  CalendarDays,
  Building,
  Eye,
  Users,
  MapPin,
  FileText,
  Timer,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useEnhancedDashboardStats } from '@/hooks/useEnhancedDashboardStats';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import EmployeeLimitCard from './EmployeeLimitCard';
import ProjectsProgressOverview from './ProjectsProgressOverview';
import LiveActiveEmployees from './LiveActiveEmployees';
import WeatherCard from './WeatherCard';
import BirthdayWidget from '@/components/common/BirthdayWidget';
import { useEmployees, useUserProfile } from '@/hooks/new/useUsers';
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
  const { data } = useEmployees();

  const activeEmployeeCount = data?.archivedEmployeesCount;

  // Handler for card clicks
  const navigateToSection = (section: string) => {
    setActiveTab(section);
  };

  const quickActions = [
    {
      title: 'Live Punch Monitor',
      description: 'Track active employee punches',
      icon: Clock,
      id: 'live-punch-monitor'
    },
    {
      title: 'Time Requests',
      description: 'Review missed punch requests',
      icon: CheckCircle,
      id: 'time-requests'
    },
    {
      title: 'Daily Reports',
      description: 'View jobsite daily reports',
      icon: FileText,
      id: 'daily-reports'
    },
    {
      title: 'Bills & Expenses',
      description: 'Manage company bills',
      icon: Receipt,
      id: 'bills-expenses'
    }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <HeroCard onClick={() => setActiveTab('settings')}/>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border border-orange-100 hover:border-orange-200 bg-gradient-to-br from-white to-orange-50 rounded-2xl"
              onClick={() => setActiveTab(action.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <action.icon className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* License Warning Banner */}
      <LicenseWarningBanner />

      {/* Employee Limit Card */}
      <EmployeeLimitCard />

      {/* Company Overview Stats Cards - Restyled to match */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Company Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* First Row - Basic KPIs */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl shadow-sm" onClick={() => navigateToSection('employees')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Active Employees</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : activeEmployeeCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl shadow-sm" onClick={() => navigateToSection('jobsites')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Active Jobsites</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats?.jobsitesCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl shadow-sm" onClick={() => navigateToSection('invoices')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Pending Invoices</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats?.invoicesCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl shadow-sm" onClick={() => navigateToSection('timesheets')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Hours This Week</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats?.totalHoursThisWeek || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Timer className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Second Row - Enhanced KPIs */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl shadow-sm" onClick={() => navigateToSection('invoices')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Overdue Invoices</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats?.overdueInvoicesCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl shadow-sm" onClick={() => navigateToSection('jobsites')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Jobsites Near Completion</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats?.jobsitesNearCompletion || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl shadow-sm" onClick={() => navigateToSection('timesheets')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Timesheets (Last 7 Days)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats?.timesheetsCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Progress and Live Punch-ins - Preserved as requested */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectsProgressOverview />
        <LiveActiveEmployees />
      </div>

    </div>
  );
};
export default AdminDashboardContent;

function HeroCard({ onClick }:{ onClick: () => void }) {
  const { data: userProfile } = useUserProfile();
  const { user } = useAuth();
  const firstName = userProfile?.first_name || user?.firstName || 'Admin';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch" >
      {/* Hero Card (left) */}
      <div className="lg:col-span-2 h-full flex flex-col" >
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50 rounded-2xl h-full">
          <CardContent className="p-6 h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 h-full">
              <div className="flex-shrink-0">
                <EmployeeAvatar
                  photoUrl={userProfile?.photo_url || undefined}
                  firstName={userProfile?.first_name || user?.firstName || undefined}
                  lastName={userProfile?.last_name || user?.lastName || undefined}
                  size="lg"
                  className="shadow-lg"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    Welcome back, {firstName} 👋
                  </h1>
                  <p className="text-slate-600 text-base">
                    A great day to get a clear view of your company.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                    <span className="w-2 h-2 rounded-full mr-2 animate-pulse bg-orange-500"></span>
                    {user?.role || 'Admin'}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Building className="h-4 w-4" />
                  <span>{user?.companyName || 'Not Assigned'}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClick}
                  className="w-fit"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View My Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Today Card (right) */}
      <div className="flex flex-col gap-4">
        <WeatherCard />
        <BirthdayWidget variant="orange" />
      </div>
    </div >
  )
}