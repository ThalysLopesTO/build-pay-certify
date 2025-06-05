
import React from 'react';
import CompanyOverviewCard from './CompanyOverviewCard';
import LicenseWarningBanner from '../../common/LicenseWarningBanner';
import PlanCancellationCard from '../PlanCancellationCard';

interface AdminDashboardContentProps {
  setActiveTab: (tab: string) => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ setActiveTab }) => {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome to your company admin panel</p>
      </div>

      {/* License Warning Banner */}
      <LicenseWarningBanner />

      {/* Company Overview - Single centered card */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <CompanyOverviewCard />
        </div>
      </div>

      {/* Plan Cancellation Card */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <PlanCancellationCard />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;
