
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import WeeklyHoursCard from './WeeklyHoursCard';
import EmployeeQuickActions from './EmployeeQuickActions';
import EmployeeSummaryCard from './EmployeeSummaryCard';

interface EmployeeDashboardHomeProps {
  onNavigateToTab: (tab: string) => void;
}

const EmployeeDashboardHome: React.FC<EmployeeDashboardHomeProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-2 px-4 py-6 bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg mx-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome back, {user?.first_name || 'Employee'} 👋
        </h1>
        <p className="text-slate-600 text-sm md:text-base">
          Manage your work efficiently and stay productive
        </p>
      </div>

      {/* Summary Cards */}
      <div className="px-4 space-y-4">
        <WeeklyHoursCard />
        <EmployeeSummaryCard />
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <EmployeeQuickActions onNavigateToTab={onNavigateToTab} />
      </div>
    </div>
  );
};

export default EmployeeDashboardHome;
