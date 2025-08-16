import React from 'react';
import { Building2 } from 'lucide-react';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* StackBuild Logo matching Company Login style */}
      <img 
        src="/lovable-uploads/2b4f2222-3401-4d41-ae19-77c8f77362b6.png" 
        alt="StackBuild" 
        className="h-12 w-auto mx-auto mb-4"
      />
      
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Choose your dashboard</h1>
      <p className="text-slate-600">Select the appropriate login for your role</p>
    </div>
  );
};

export default LoginHeader;