
import React from 'react';
import { Clock, FileText, AlertTriangle, Settings, Home, Package, ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmployeeDesktopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const EmployeeDesktopNav: React.FC<EmployeeDesktopNavProps> = ({ activeTab, onTabChange }) => {
  const isMobile = useIsMobile();

  // Don't render on mobile as we have the bottom nav
  if (isMobile) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      color: 'text-slate-600'
    },
    {
      id: 'time-tracker',
      label: 'Time Clock',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      id: 'timesheet',
      label: 'Timesheets',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      id: 'missed-punch-requests',
      label: 'Missed Punch',
      icon: ClockIcon,
      color: 'text-amber-600'
    },
    {
      id: 'attention-report',
      label: 'Report Issue',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 'my-reports',
      label: 'My Reports',
      icon: Package,
      color: 'text-purple-600'
    },
    {
      id: 'settings',
      label: 'Profile',
      icon: Settings,
      color: 'text-slate-600'
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="flex items-center space-x-1 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? `${item.color} bg-slate-100 shadow-sm font-medium` 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default EmployeeDesktopNav;
