
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  AlertTriangle, 
  Clock,
  Settings,
  Award,
  BookOpen,
  Timer,
  ArrowRight
} from 'lucide-react';

interface EmployeeQuickActionsProps {
  onNavigateToTab: (tab: string) => void;
}

const EmployeeQuickActions: React.FC<EmployeeQuickActionsProps> = ({ onNavigateToTab }) => {
  const primaryActions = [
    {
      title: 'Time Tracker',
      description: 'Clock in/out and track your time',
      icon: Timer,
      onClick: () => onNavigateToTab('time-tracker'),
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
      textColor: 'text-white'
    },
    {
      title: 'Submit Timesheet',
      description: 'Submit your weekly hours',
      icon: FileText,
      onClick: () => onNavigateToTab('timesheet'),
      color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      textColor: 'text-white'
    },
    {
      title: 'Report Issue',
      description: 'Submit an attention report',
      icon: AlertTriangle,
      onClick: () => onNavigateToTab('attention-report'),
      color: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      textColor: 'text-white'
    }
  ];

  const secondaryActions = [
    {
      title: 'My Reports',
      icon: FileText,
      onClick: () => onNavigateToTab('my-reports'),
      color: 'text-slate-700'
    },
    {
      title: 'Certificates',
      icon: Award,
      onClick: () => onNavigateToTab('certificates'),
      color: 'text-purple-600'
    },
    {
      title: 'Company Rules',
      icon: BookOpen,
      onClick: () => onNavigateToTab('company-rules'),
      color: 'text-indigo-600'
    },
    {
      title: 'Settings',
      icon: Settings,
      onClick: () => onNavigateToTab('settings'),
      color: 'text-slate-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 px-2">Quick Actions</h2>
        <div className="space-y-3">
          {primaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-0">
                  <Button
                    onClick={action.onClick}
                    className={`w-full h-auto p-6 justify-start ${action.color} ${action.textColor} transition-all duration-200`}
                    variant="default"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="p-3 bg-white/20 rounded-full">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 opacity-70" />
                    </div>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 px-2">More Options</h2>
        <div className="grid grid-cols-2 gap-3">
          {secondaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-0">
                  <Button
                    onClick={action.onClick}
                    variant="ghost"
                    className="w-full h-auto p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-3 text-center">
                      <div className="p-3 bg-slate-100 rounded-full">
                        <Icon className={`h-5 w-5 ${action.color}`} />
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
