import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoginLoadingProps {
  message?: string;
}

const LoginLoading: React.FC<LoginLoadingProps> = ({ 
  message = "Setting up your workspace..." 
}) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center max-w-md mx-4">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Welcome to StackBuild
        </h3>
        <p className="text-muted-foreground">
          {message}
        </p>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginLoading;