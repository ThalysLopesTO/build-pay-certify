import React from 'react';
import PlanTab from '@/components/common/user-settings/PlanTab';

const PlanPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Subscription Plan</h1>
        <PlanTab />
      </div>
    </div>
  );
};

export default PlanPage;