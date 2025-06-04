
import React from 'react';
import Header from '@/components/Header';

const SuperAdminLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoading;
