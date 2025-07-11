import React from 'react';

const EmployeeLoadingState: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-2 text-slate-600">Loading employees...</p>
      </div>
    </div>
  );
};

export default EmployeeLoadingState;