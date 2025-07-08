import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Clock, DollarSign, Receipt, BarChart3, TrendingUp } from 'lucide-react';
import { useManagementDashboardStats } from '@/hooks/useManagementDashboardStats';

const ManagementDashboardHome = () => {
  const { data: stats, isLoading } = useManagementDashboardStats();

  const quickActions = [
    {
      title: 'Timesheet Approval',
      description: 'Review and approve employee timesheets',
      icon: Clock,
      color: 'bg-blue-500',
      id: 'timesheets'
    },
    {
      title: 'Payroll Summary',
      description: 'View payroll calculations and summaries',
      icon: DollarSign,
      color: 'bg-green-500',
      id: 'payroll-summary'
    },
    {
      title: 'Bills & Expenses',
      description: 'Manage company bills and expenses',
      icon: Receipt,
      color: 'bg-purple-500',
      id: 'bills-expenses'
    },
    {
      title: 'Reports',
      description: 'View attention reports and analytics',
      icon: BarChart3,
      color: 'bg-orange-500',
      id: 'reports'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const dashboardStats = [
    {
      title: 'Pending Timesheets',
      value: isLoading ? '...' : stats?.pendingTimesheetsCount?.toString() || '0',
      icon: Clock,
      change: 'Awaiting approval',
      changeType: 'neutral'
    },
    {
      title: 'This Week Payroll',
      value: isLoading ? '...' : formatCurrency(stats?.currentWeekPayroll || 0),
      icon: DollarSign,
      change: 'Current week total',
      changeType: 'neutral'
    },
    {
      title: 'Pending Bills',
      value: isLoading ? '...' : stats?.pendingBillsCount?.toString() || '0',
      icon: Receipt,
      change: 'Unpaid bills',
      changeType: stats?.pendingBillsCount && stats.pendingBillsCount > 0 ? 'decrease' : 'neutral'
    },
    {
      title: 'Open Reports',
      value: isLoading ? '...' : stats?.openReportsCount?.toString() || '0',
      icon: BarChart3,
      change: 'Attention reports',
      changeType: stats?.openReportsCount && stats.openReportsCount > 0 ? 'increase' : 'neutral'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center space-x-3">
        <Calculator className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Management Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Operations and payroll management center</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <stat.icon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Badge 
                  variant={stat.changeType === 'increase' ? 'default' : stat.changeType === 'decrease' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 ${action.color} rounded-lg`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Management Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Management Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Timesheets Processed</span>
              <Badge variant="secondary">
                {isLoading ? '...' : `${stats?.approvedTimesheetsCount || 0}/${stats?.totalTimesheetsCount || 0}`}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Pending Actions</span>
              <Badge variant={stats?.pendingTimesheetsCount && stats.pendingTimesheetsCount > 0 ? 'destructive' : 'default'}>
                {isLoading ? '...' : stats?.pendingTimesheetsCount || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Outstanding Bills</span>
              <Badge variant={stats?.pendingBillsCount && stats.pendingBillsCount > 0 ? 'destructive' : 'default'}>
                {isLoading ? '...' : stats?.pendingBillsCount || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Attention Reports</span>
              <Badge variant={stats?.openReportsCount && stats.openReportsCount > 0 ? 'destructive' : 'secondary'}>
                {isLoading ? '...' : stats?.openReportsCount || 0}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementDashboardHome;