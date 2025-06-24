
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWeeklyHoursSummary } from '@/hooks/useWeeklyHoursSummary';
import { 
  FileText, 
  AlertTriangle, 
  Award, 
  BookOpen, 
  Book, 
  Settings 
} from 'lucide-react';

interface DashboardCard {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

interface EmployeeDashboardHomeProps {
  onNavigateToTab: (tab: string) => void;
}

const EmployeeDashboardHome: React.FC<EmployeeDashboardHomeProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const { data: totalHours, isLoading } = useWeeklyHoursSummary();

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Submit Timesheet',
      icon: <FileText className="h-8 w-8" />,
      onClick: () => onNavigateToTab('timesheet'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'My Reports',
      icon: <AlertTriangle className="h-8 w-8" />,
      onClick: () => onNavigateToTab('my-reports'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Certificates',
      icon: <Award className="h-8 w-8" />,
      onClick: () => onNavigateToTab('certificates'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Company Rules',
      icon: <BookOpen className="h-8 w-8" />,
      onClick: () => onNavigateToTab('company-rules'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Handbook',
      icon: <Book className="h-8 w-8" />,
      onClick: () => onNavigateToTab('handbook'),
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Settings',
      icon: <Settings className="h-8 w-8" />,
      onClick: () => onNavigateToTab('settings'),
      color: 'bg-slate-500 hover:bg-slate-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.firstName || 'Employee'} 👷‍♂️
        </h1>
        <p className="text-slate-600">
          Manage your timesheets, reports, and stay up to date with company information
        </p>
      </div>

      {/* Weekly Hours Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">This Week's Hours</h3>
              <p className="text-slate-600">Track your weekly progress</p>
            </div>
            <div className="text-right">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-16 bg-slate-200 rounded"></div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  {totalHours || 0}h
                </div>
              )}
              <p className="text-sm text-slate-500">total hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardCards.map((card, index) => (
          <Card 
            key={index} 
            className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={card.onClick}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full text-white ${card.color} transition-colors duration-200`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 group-hover:text-slate-700">
                  {card.title}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDashboardHome;
