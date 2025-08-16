import React from 'react';
import { Building2 } from 'lucide-react';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* StackBuild Logo matching Company Login style */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-600 rounded-xl">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800">
            StackBuild
          </h1>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Choose your dashboard</h1>
      <p className="text-slate-600">Select the appropriate login for your role</p>
    </div>
  );
};

export default LoginHeader;