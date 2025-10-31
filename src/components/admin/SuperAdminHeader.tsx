
import React from 'react';

interface SuperAdminHeaderProps {
  pendingCount: number;
}

const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ pendingCount }) => {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-semibold text-foreground">
        Company Management
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Manage company registrations, licenses, and system-wide settings
        {pendingCount > 0 && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            {pendingCount} pending approval
          </span>
        )}
      </p>
    </div>
  );
};

export default SuperAdminHeader;
