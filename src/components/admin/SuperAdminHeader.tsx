
import React from 'react';

interface SuperAdminHeaderProps {
  pendingCount: number;
}

const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ pendingCount }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Manage company registrations and licenses
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
