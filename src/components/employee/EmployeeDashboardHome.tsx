
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Building, User, Clock, Timer, FileText, AlertTriangle, Award, Settings, ArrowRight, Eye, AlertCircle, CheckSquare } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTimesheets } from '@/hooks/useTimesheets';
import DashboardHero from '@/components/dashboard/DashboardHero';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { isMenuItemVisible } from '@/utils/menuPermissions';
import BirthdayWidget from '@/components/common/BirthdayWidget';

interface EmployeeDashboardHomeProps {
  onNavigateToTab: (tab: string) => void;
}

const EmployeeDashboardHome: React.FC<EmployeeDashboardHomeProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const { totalWeeklyHours, isLoading: hoursLoading } = useTimesheets();
  const { data: permissions } = useRolePermissions();

  // Fetch full user profile with photo
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
        console.warn('User profile fetch error (non-fatal):', error.message);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const targetHours = 40;
  const progressPercentage = Math.min((totalWeeklyHours / targetHours) * 100, 100);

  const allQuickActions = [
    {
      id: 'tasks',
      title: 'My Tasks',
      icon: CheckSquare,
      onClick: () => onNavigateToTab('tasks'),
      color: 'bg-green-600 hover:bg-green-700',
      description: 'View & complete tasks'
    },
    {
      id: 'time-tracker',
      title: 'Clock In/Out',
      icon: Timer,
      onClick: () => onNavigateToTab('time-tracker'),
      color: 'bg-emerald-600 hover:bg-emerald-700',
      description: 'Track time'
    },
    {
      id: 'attention-report',
      title: 'Report Issue',
      icon: AlertTriangle,
      onClick: () => onNavigateToTab('attention-report'),
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'Submit report'
    },
    {
      id: 'timesheet',
      title: 'Timesheet',
      icon: FileText,
      onClick: () => onNavigateToTab('timesheet'),
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Submit hours'
    },
    {
      id: 'missed-punch-requests',
      title: 'Missed Punch',
      icon: AlertCircle,
      onClick: () => onNavigateToTab('missed-punch-requests'),
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Report missed punch'
    },
    {
      id: 'certificates',
      title: 'Certificates',
      icon: Award,
      onClick: () => onNavigateToTab('certificates'),
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'View certs'
    }
  ];

  const quickActions = allQuickActions.filter(action => 
    isMenuItemVisible(action.id, permissions, user?.role || 'employee')
  );

  return (
    <div className="space-y-6 animate-fade-in p-4 max-w-6xl mx-auto">
      {/* Hero Section - Welcome + Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card with Photo */}
<div className="lg:col-span-2">
  <DashboardHero
    theme="blue"
    firstName={user?.firstName}
    lastName={user?.lastName}
    photoUrl={userProfile?.photo_url}
    companyName={user?.companyName}
    trade={user?.trade}
    onViewProfile={() => onNavigateToTab('settings')}
  />
</div>

        {/* Weekly Hours Card + Birthday Widget */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium opacity-90">This Week's Hours</h3>
                    <div className="text-2xl font-bold">
                      {hoursLoading ? 'Loading...' : `${totalWeeklyHours.toFixed(1)} hrs`}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs opacity-90">
                    <span>Progress to 40 hrs</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <BirthdayWidget variant="blue" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-0 shadow-md"
                onClick={action.onClick}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className={`mx-auto w-12 h-12 rounded-full ${action.color} flex items-center justify-center transition-colors`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{action.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'my-reports', title: 'My Reports', icon: FileText, tab: 'my-reports' },
          { id: 'company-rules', title: 'Company Rules', icon: Building, tab: 'company-rules' },
          { id: 'settings', title: 'Settings', icon: Settings, tab: 'settings' },
          { id: 'time-tracker', title: 'Time Tracker', icon: Timer, tab: 'time-tracker' }
        ].filter(item => 
          isMenuItemVisible(item.id, permissions, user?.role || 'employee')
        ).map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-4 hover:bg-slate-50 transition-colors"
              onClick={() => onNavigateToTab(item.tab)}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeDashboardHome;
