
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TimesheetErrorAlertProps {
  error: any;
  isLoading: boolean;
  onRefetch: () => void;
}

const TimesheetErrorAlert: React.FC<TimesheetErrorAlertProps> = ({
  error,
  isLoading,
  onRefetch
}) => {
  const isPermissionError = (error: any) => {
    return error?.message?.includes('permission denied') || 
           error?.message?.includes('auth.users') ||
           error?.code === 'PGRST301';
  };

  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isPermissionError(error) ? (
            <div className="space-y-2">
              <p className="font-semibold">Access Permission Error</p>
              <p>Unable to load timesheets due to database permissions. This might be a temporary issue.</p>
              <div className="flex gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefetch} 
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                If this issue persists, please contact support or try logging out and back in.
              </p>
            </div>
          ) : (
            <div>
              Failed to load timesheets: {error.message}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefetch} 
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TimesheetErrorAlert;
