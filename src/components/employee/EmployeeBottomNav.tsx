
import React from 'react';
import { Clock, FileText, AlertTriangle, Settings, Home, AlertCircle } from 'lucide-react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { filterMenuByPermissions } from '@/utils/menuPermissions';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface EmployeeBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const EmployeeBottomNav: React.FC<EmployeeBottomNavProps> = ({ activeTab, onTabChange }) => {
  const { data: permissions } = useRolePermissions();
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      title: 'Home',
      label: 'Home',
      icon: Home,
      color: 'text-slate-600'
    },
    {
      id: 'timesheet',
      title: 'Timesheet',
      label: 'Timesheet',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      id: 'missed-punch-requests',
      title: 'Missed Punch',
      label: 'Missed Punch',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      id: 'attention-report',
      title: 'Report',
      label: 'Report',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 'settings',
      title: 'Settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-slate-600'
    }
  ];

  const filteredNavItems = filterMenuByPermissions(
    navItems,
    permissions,
    user?.role || 'employee'
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1 safe-area-pb shadow-lg">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive 
                  ? `${item.color} bg-slate-50 scale-105 shadow-sm` 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeBottomNav;
