import React from 'react';

const SuperAdminNavigation: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          {/* StackBuild Logo */}
          <img 
            src="/lovable-uploads/04cf020d-b64e-49b8-ae51-022a05b6cad8.png" 
            alt="StackBuild Logo" 
            className="h-10 w-auto md:h-12 object-contain"
          />
          
          {/* Divider */}
          <div className="h-8 w-px bg-border hidden sm:block" />
          
          {/* Title */}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              Super Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">
              Platform Owner Controls
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminNavigation;
