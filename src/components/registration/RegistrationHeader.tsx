
import React from 'react';
import { CheckCircle } from 'lucide-react';

const RegistrationHeader: React.FC = () => {
  return (
    <div className="text-center mb-10">
      <div className="flex justify-center mb-6">
        <img 
          src="/lovable-uploads/04cf020d-b64e-49b8-ae51-022a05b6cad8.png" 
          alt="StackBuild Logo" 
          className="h-16 w-auto"
        />
      </div>
      
      <div className="flex items-center justify-center gap-2 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <span className="text-green-600 font-semibold">Payment Successful</span>
      </div>
      
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3">
        Complete Your Company Registration
      </h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
        You're just one step away from accessing the complete Construction Payroll Management System. 
        Please provide your company details below to get started.
      </p>
    </div>
  );
};

export default RegistrationHeader;
