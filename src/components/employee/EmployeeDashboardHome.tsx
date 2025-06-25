
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-2 px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome back, {user?.firstName || 'Employee'} 👷‍♂️
        </h1>
        <p className="text-slate-600 text-sm md:text-base">
          Track your time and manage your work efficiently
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        <EmployeeSummaryCard />
        <WeeklyHoursCard />
      </div>

      {/* Quick Actions */}
      <EmployeeQuickActions onNavigateToTab={onNavigateToTab} />
    </div>
  );
};

export default EmployeeDashboardHome;
