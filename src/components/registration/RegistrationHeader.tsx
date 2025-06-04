
import React from 'react';
import { Building } from 'lucide-react';

const RegistrationHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <Building className="h-12 w-12 text-orange-600 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-slate-900">Register Your Company</h1>
      <p className="text-slate-600 mt-2">
        Request access to the Construction Payroll Management System
      </p>
    </div>
  );
};

export default RegistrationHeader;
