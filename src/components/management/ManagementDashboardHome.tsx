import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  DollarSign, 
  Receipt, 
  BarChart3, 
  CalendarDays, 
  CheckCircle,
  Building,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useManagementDashboardStats } from '@/hooks/useManagementDashboardStats';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import WeatherCard from '../admin/dashboard/WeatherCard';

interface ManagementDashboardHomeProps {
  setActiveTab: (tab: string) => void;
}

const ManagementDashboardHome: React.FC<ManagementDashboardHomeProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useManagementDashboardStats();

  // Fetch user profile data
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const quickActions = [
    {
      title: 'My Timesheet',
      description: 'Submit and manage your timesheet',
      icon: Clock,
      id: 'my-timesheet'
    },
    {
      title: 'Timesheet Approval',
      description: 'Review and approve timesheets',
      icon: Clock,
      id: 'timesheets'
    },
    {
      title: 'Payroll Summary',
      description: 'View payroll calculations',
      icon: DollarSign,
      id: 'payroll-summary'
    },
    {
      title: 'Bills & Expenses',
      description: 'Manage company bills',
      icon: Receipt,
      id: 'bills-expenses'
    },
    {
      title: 'Reports',
      description: 'View and resolve reports',
      icon: BarChart3,
      id: 'reports'
    }
  ];

  // Calculate progress for approvals completed
  const totalTimesheets = stats?.totalTimesheetsCount || 0;
  const approvedTimesheets = stats?.approvedTimesheetsCount || 0;
  const approvalProgress = totalTimesheets > 0 ? Math.round((approvedTimesheets / totalTimesheets) * 100) : 0;

  // Calculate overdue bills
  const overdueCount = 0; // This would need to be calculated based on due dates

  const userName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : user?.firstName || 'Manager';
  const firstName = userProfile?.first_name || user?.firstName || 'Manager';

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-48 animate-pulse">
              <CardContent className="p-6 h-full bg-gray-100 rounded-2xl" />
            </Card>
          </div>
          <div>
            <Card className="h-48 animate-pulse">
              <CardContent className="p-6 h-full bg-gray-100 rounded-2xl" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Hero + Overview row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
        {/* Hero Card (left) */}
        <div className="lg:col-span-2">
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
                      Manage operations, payroll, and approvals efficiently.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                      <span className="w-2 h-2 rounded-full mr-2 animate-pulse bg-orange-500"></span>
                      Operations Manager
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Building className="h-4 w-4" />
                    <span>{user?.companyName || 'Not Assigned'}</span>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('settings')}
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
        <WeatherCard variant="orange" locationStrategy="company-first" />
      </div>

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
    </div>
  );
};

export default ManagementDashboardHome;