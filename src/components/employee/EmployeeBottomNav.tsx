
import React from 'react';
import { Clock, FileText, AlertTriangle, Settings } from 'lucide-react';

interface EmployeeBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const EmployeeBottomNav: React.FC<EmployeeBottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    {
      id: 'timesheet',
      label: 'Timesheet',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      id: 'attention-report',
      label: 'Report',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 'my-reports',
      label: 'My Reports',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-slate-600'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                isActive 
                  ? `${item.color} bg-slate-100` 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeBottomNav;
