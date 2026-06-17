
import React from 'react';
import { Clock, FileText, AlertTriangle, Settings, Home, AlertCircle, CheckSquare } from 'lucide-react';
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
      id: 'tasks',
      title: 'Tasks',
      label: 'Tasks',
      icon: CheckSquare,
      color: 'text-green-600'
    },
    {
      id: 'time-tracker',
      title: 'Time Clock',
      label: 'Clock',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      id: 'missed-punch-requests',
      title: 'Missed Punch',
      label: 'Punch',
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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 pt-1 safe-area-pb shadow-lg">
      <div className="flex justify-around items-center gap-0.5 max-w-lg mx-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.title}
              className={`flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive
                  ? `${item.color} bg-slate-50 shadow-sm`
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium leading-tight truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeBottomNav;
