
import React from 'react';
import { Crown } from 'lucide-react';

interface SuperAdminHeaderProps {
  pendingCount: number;
}

const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ pendingCount }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center">
          <Crown className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3 text-purple-600" />
          <span className="hidden sm:inline">Super Admin Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </h1>
        <p className="text-slate-600 mt-1 text-sm md:text-base hidden sm:block">
          Platform Owner Controls - Manage company registrations, licenses, and system-wide settings
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {pendingCount} pending approval
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SuperAdminHeader;
