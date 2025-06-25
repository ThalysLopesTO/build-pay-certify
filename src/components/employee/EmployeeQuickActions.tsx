
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  AlertTriangle, 
  Clock,
  Settings,
  Award,
  BookOpen
} from 'lucide-react';

interface EmployeeQuickActionsProps {
  onNavigateToTab: (tab: string) => void;
}

const EmployeeQuickActions: React.FC<EmployeeQuickActionsProps> = ({ onNavigateToTab }) => {
  const primaryActions = [
    {
      title: 'Time Tracker',
      description: 'Clock in/out and track time',
      icon: Clock,
      onClick: () => onNavigateToTab('time-tracker'),
      color: 'bg-emerald-500 hover:bg-emerald-600',
      textColor: 'text-white'
    },
    {
      title: 'Submit Timesheet',
      description: 'Submit your weekly hours',
      icon: FileText,
      onClick: () => onNavigateToTab('timesheet'),
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      title: 'Report Issue',
      description: 'Submit an attention report',
      icon: AlertTriangle,
      onClick: () => onNavigateToTab('attention-report'),
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-white'
    }
  ];

  const secondaryActions = [
    {
      title: 'My Reports',
      icon: FileText,
      onClick: () => onNavigateToTab('my-reports')
    },
    {
      title: 'Certificates',
      icon: Award,
      onClick: () => onNavigateToTab('certificates')
    },
    {
      title: 'Company Rules',
      icon: BookOpen,
      onClick: () => onNavigateToTab('company-rules')
    },
    {
      title: 'Settings',
      icon: Settings,
      onClick: () => onNavigateToTab('settings')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 px-2">Quick Actions</h2>
        <div className="space-y-3">
          {primaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <Button
                    onClick={action.onClick}
                    className={`w-full h-auto p-4 justify-start ${action.color} ${action.textColor} hover:scale-[1.02] transition-all duration-200`}
                    variant="default"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="p-2 bg-white/20 rounded-full">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-base">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 px-2">More Options</h2>
        <div className="grid grid-cols-2 gap-3">
          {secondaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <Button
                    onClick={action.onClick}
                    variant="ghost"
                    className="w-full h-auto p-4 hover:bg-slate-50"
                  >
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <div className="p-2 bg-slate-100 rounded-full">
                        <Icon className="h-5 w-5 text-slate-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {action.title}
                      </span>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeQuickActions;
